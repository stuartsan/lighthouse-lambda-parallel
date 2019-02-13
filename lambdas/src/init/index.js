const AWS = require("aws-sdk");
const uuidv1 = require("uuid/v1");
const assert = require("assert");

AWS.config.update({ region: process.env.REGION });

const sns = new AWS.SNS();
const ddb = new AWS.DynamoDB.DocumentClient();

async function createJobItemDynamo(jobId, startTime, totalPages) {
  return ddb
    .put({
      TableName: process.env.TABLE_NAME,
      Item: {
        JobId: jobId,
        StartTime: startTime,
        PageCountTotal: totalPages,
        PageCountSuccess: 0,
        PageCountError: 0
      }
    })
    .promise();
}

const createSNSMessages = (urls, jobId, lighthouseOpts = {}) => {
  return urls.map(url => ({
    Message: "url ready to process",
    MessageAttributes: {
      JobId: {
        DataType: "String",
        StringValue: jobId
      },
      URL: {
        DataType: "String",
        StringValue: url
      },
      LighthouseOptions: {
        DataType: "String",
        StringValue: JSON.stringify(lighthouseOpts)
      }
    },
    TopicArn: process.env.SNS_TOPIC_ARN
  }));
};

exports.handler = async function(event, context, callback) {
  const jobId = uuidv1();
  const now = new Date();

  assert(
    Array.isArray(event.urls) && event.urls.length > 0,
    `Requires at least one url, you passed in ${event.urls.length}`
  );

  assert(
    Number.isInteger(event.runsPerUrl) && event.runsPerUrl > 0,
    `Requires at least one run per url, you passed in ${event.runsPerUrl}`
  );

  const urls = [];
  event.urls.forEach(url => {
    for (let i = 0; i < event.runsPerUrl; i++) {
      urls.push(url);
    }
  });

  await createJobItemDynamo(jobId, now.toISOString(), urls.length);
  const snsMessages = createSNSMessages(urls, jobId, event.lighthouseOpts);

  await Promise.all(snsMessages.map(msg => sns.publish(msg).promise()));

  return { jobId };
};
