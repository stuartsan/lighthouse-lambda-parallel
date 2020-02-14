const AWS = require("aws-sdk");
const uuid = require("uuid");
const assert = require("assert");
const uuidv1 = uuid.v1;

AWS.config.update({ region: process.env.REGION });

const sns = new AWS.SNS();
const ddb = new AWS.DynamoDB.DocumentClient();
const ttl = 60 * 60 * 24 * 14;

async function createJobItemDynamo(jobId, startTime, totalPages) {
  return ddb
    .put({
      TableName: process.env.TABLE_NAME,
      Item: {
        JobId: jobId,
        StartTime: startTime,
        TimeToExist: Math.floor(Date.now() / 1000) + ttl,
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
