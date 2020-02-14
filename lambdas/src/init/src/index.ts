import AWS = require("aws-sdk");
import uuid = require("uuid");
import assert = require("assert");
import {UrlPayload} from "./UrlPayload";

const uuidv1 = uuid.v1;

AWS.config.update({region: process.env.REGION});

const sns = new AWS.SNS();
const ddb = new AWS.DynamoDB.DocumentClient();
const ttl = 60 * 60 * 24 * 14;

async function createJobItemDynamo(jobId: string, startTime: string, totalPages: number) {
    return ddb
        .put({
            TableName: String(process.env.TABLE_NAME),
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

const createSNSMessages = (urls: Array<UrlPayload>, jobId: string, lighthouseOpts = {}) => {
    return urls.map(url => ({
        Message: "url ready to process",
        MessageAttributes: {
            JobId: {
                DataType: "String",
                StringValue: jobId
            },
            URL: {
                DataType: "String",
                StringValue: url.url
            },
            Metadata: {
                DataType: "String",
                StringValue: JSON.stringify(url.metadata)
            },
            LighthouseOptions: {
                DataType: "String",
                StringValue: JSON.stringify(lighthouseOpts)
            }
        },
        TopicArn: process.env.SNS_TOPIC_ARN
    }));
};

export const handler = async (event: any = {}) => {
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

    const urls: Array<UrlPayload> = [];
    event.urls.forEach((url: UrlPayload) => {
        for (let i = 0; i < event.runsPerUrl; i++) {
            urls.push(url);
        }
    });

    await createJobItemDynamo(jobId, now.toISOString(), urls.length);
    const snsMessages = createSNSMessages(urls, jobId, event.lighthouseOpts);

    await Promise.all(snsMessages.map(msg => sns.publish(msg).promise()));

    return {jobId};
};
