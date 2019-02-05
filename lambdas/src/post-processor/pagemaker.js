// FIXME get rid of this from node_modules, the lambda one is fine
const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const jobWith1k = "753c74b0-2c21-11e9-9b13-091d7dcd0d16";

async function getAllRunIdsForJob(jobId, lastEvaluatedKey) {
  const params = {
    TableName: process.env.RUNS_TABLE_NAME,
    IndexName: "JobIdIndex",
    KeyConditionExpression: "JobId = :jobid",
    ExpressionAttributeValues: {
      ":jobid": jobId
    }
  };

  // we are recursively paginating!
  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  const result = await ddb.query(params).promise();

  if (result.LastEvaluatedKey) {
    const nextRuns = await getAllRunIdsForJob(jobId, lastEvaluatedKey);
    return result.Items.concat(nextRuns);
  }

  return result.Items;
}

async function fetchReportJSON(runId, jobId) {
  return { runId, jobId };
}

const s3Key = (jobId, runId, outputFormat) =>
  `raw_reports/${outputFormat}/jobs/${jobId}/runs/${runId}.${outputFormat}`;

async function main() {
  const runs = await getAllRunIdsForJob(jobWith1k);

  const results = [];

  let i = 0;

  // FIXME NEED some concurrency up in here
  for (const run of runs) {
    const key = s3Key(run.JobId, run.RunId, "json");
    i++;

    console.log(i);

    try {
      const contents = await s3
        .getObject({
          Bucket: process.env.BUCKET,
          Key: key
        })
        .promise();

      results.push(contents);
    } catch (err) {
      // ok fine no reprocess
      if (err.code === "NoSuchKey") {
        console.log("yo that key does not appear to exist", key);
      } else {
        console.log(err);
      }
    }
  }

  console.log(results);
}

main();
