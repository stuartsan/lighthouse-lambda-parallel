const AWS = require("aws-sdk");

const createLighthouse = require("./create-lighthouse.js");
const fs = require("fs");

AWS.config.update({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

async function updateJobItemAndCreateRunItem(
  jobId,
  jobAttrToIncrement,
  runId,
  runUrl,
  runError
) {
  const updatedJob = {
    TableName: process.env.JOBS_TABLE_NAME,
    Key: {
      JobId: jobId
    },
    UpdateExpression: `SET ${jobAttrToIncrement} = ${jobAttrToIncrement} + :val`,
    ExpressionAttributeValues: {
      ":val": 1
    }
  };

  await ddb.update(updatedJob).promise();

  const newRun = {
    TableName: process.env.RUNS_TABLE_NAME,
    Item: {
      JobId: jobId,
      RunId: runId
    }
  };

  if (runError) {
    newRun.Item.Error = runError;
  }

  return ddb.put(newRun).promise();
}

const s3Key = (jobId, runId, outputFormat) =>
  `raw_reports/${outputFormat}/jobs/${jobId}/runs/${runId}.${outputFormat}`;

async function doesRunItemAlreadyExist(runId, consistentRead = false) {
  const params = {
    TableName: process.env.RUNS_TABLE_NAME,
    ConsistentRead: consistentRead,
    Key: {
      RunId: runId
    }
  };

  let exists = false;
  const result = await ddb.get(params).promise();
  if (result.Item !== undefined && result.Item !== null) {
    exists = true;
  }

  return Promise.resolve(exists);
}

async function uploadReportsToS3(
  jsonReportS3Key,
  htmlReportS3Key,
  jsonReport,
  htmlReport
) {
  return Promise.all([
    s3
      .upload({
        Bucket: process.env.BUCKET,
        Key: jsonReportS3Key,
        Body: jsonReport,
        ContentType: "application/json"
      })
      .promise(),
    s3
      .upload({
        Bucket: process.env.BUCKET,
        Key: htmlReportS3Key,
        Body: htmlReport,
        ContentType: "text/html"
      })
      .promise()
  ]);
}

exports.handler = async function(event, context) {
  const record = event.Records[0];

  // We are consuming this from the dead letter queue, which means,
  // we're giving up on processing it. Tell the job/run state about this fact
  // and bail. Why can't we just wrap the contents of our handler in try/catch
  // and use the catch branch to say "something didn't work"? Zooming out,
  // there are other things that could go wrong outside our code, and the
  // dlq accounts for this (nodejs runtime issues, lambda throttling issues, etc)
  if (record.Sns.TopicArn === process.env.DLQ_ARN) {
    const originalMessage = JSON.parse(record.Sns.Message);
    const originalRecord = originalMessage.Records[0];
    console.log(
      "processing record from DLQ; original record:",
      JSON.stringify(originalRecord)
    );

    let jobId;
    try {
      jobId = originalRecord.Sns.MessageAttributes.JobId.Value;
    } catch (err) {
      // If there is no jobId there it means we're stuck in a recursive loop
      // processing errors and we're just going to throw it out, there is
      // nothing actionable to do
      return Promise.resolve();
    }

    return await updateJobItemAndCreateRunItem(
      jobId,
      "PageCountError",
      originalRecord.Sns.MessageId,
      originalRecord.Sns.MessageAttributes.URL.Value,
      `ended up in dlq: ${JSON.stringify(
        record.Sns.MessageAttributes.ErrorMessage.Value
      )}`
    );
  }

  const jobId = record.Sns.MessageAttributes.JobId.Value;
  const lighthouseOpts = JSON.parse(
    record.Sns.MessageAttributes.LighthouseOptions.Value
  );
  const runId = record.Sns.MessageId;

  const url = record.Sns.MessageAttributes.URL.Value;
  const jsonReportS3Key = s3Key(jobId, runId, "json");
  const htmlReportS3Key = s3Key(jobId, runId, "html");

  let existsAlready = await doesRunItemAlreadyExist(runId);

  // If the work is already done, probably, let's just bail before
  // doing anything time-intensive. (AWS says that it's possible that SNS
  // delivers the message to the same lambda more than once, though unlikely).
  if (existsAlready) {
    return Promise.resolve();
  }

  if (process.env.SIMULATE_EXCEPTION_BEFORE_LH_RUN) {
    throw new Error("Failed! On purpose though. Before LH run.");
  }

  const { chrome, start } = await createLighthouse(url, {
    ...lighthouseOpts,
    output: ["json", "html"]
  });
  const results = await start();

  const [jsonReport, htmlReport] = results.report;

  // we pass true to make it a guaranteed consistent read, which is more
  // expensive and more accurate.
  existsAlready = await doesRunItemAlreadyExist(runId, true);

  // Ensure some kind of idempotency -- we don't want to increment the atomic
  // counter if it's already happened for this particular url/message.
  if (existsAlready) {
    return chrome.kill();
  }

  await updateJobItemAndCreateRunItem(jobId, "PageCountSuccess", runId, url);

  try {
    await uploadReportsToS3(
      jsonReportS3Key,
      htmlReportS3Key,
      jsonReport,
      htmlReport
    );
  } catch (err) {
    // we will keep rolling instead of letting this trigger a re-run.
    // this kinda failure should be rare.
    console.log("error uploading reports to s3:", err);
  }

  return chrome.kill();
};
