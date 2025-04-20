import express from "express";
import AWS from "aws-sdk";
import auth from "../middleware/auth.js";
import winston from "winston";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

function getAwsConfigForAccount(account) {
  if (account === "prod") {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_PROD,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROD,
      region: "ap-south-1"
    };
  } else if (account === "ba") {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_BA,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_BA,
      region: process.env.AWS_REGION_BA
    };
  } else {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    };
  }
}

// Get all Lambda functions
router.get("/functions", auth, async (req, res) => {
  const account = req.query.account || "test";
  winston.info(`[GET] /functions - Fetching Lambda functions for account: ${account}...`);
  try {
    const awsConfig = getAwsConfigForAccount(account);
    const lambda = new AWS.Lambda(awsConfig);
    const data = await lambda.listFunctions().promise();
    const functions = data.Functions.map(fn => ({
      FunctionName: fn.FunctionName,
      Runtime: fn.Runtime,
      LastModified: fn.LastModified
    }));
    winston.info(`[GET] /functions - Success: ${functions.length} functions fetched for account: ${account}.`);
    res.json({ functions });
  } catch (err) {
    winston.error(`[GET] /functions - Error: ${err}`);
    res.status(500).json({ message: "Failed to fetch Lambda functions." });
  }
});

// Get environment variables for a Lambda function
router.get("/functions/:functionName/env", auth, async (req, res) => {
  const { functionName } = req.params;
  const account = req.query.account || "test";
  winston.info(`[GET] /functions/${functionName}/env - Fetching environment variables for account: ${account}...`);
  try {
    const awsConfig = getAwsConfigForAccount(account);
    const lambda = new AWS.Lambda(awsConfig);
    const data = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();
    winston.info(`[GET] /functions/${functionName}/env - Success for account: ${account}.`);
    res.json({ environment: data.Environment?.Variables || {}, account });
  } catch (err) {
    winston.error(`[GET] /functions/${functionName}/env - Error: ${err} | Stack: ${err.stack}`);
    res.status(500).json({ message: "Failed to fetch environment variables.", error: err.message, stack: err.stack });
  }
});

// Update environment variable value for a Lambda function
router.put("/functions/:functionName/env", auth, async (req, res) => {
  const { functionName } = req.params;
  const { key, value } = req.body;
  const account = req.query.account || "test";
  winston.info(`[PUT] /functions/${functionName}/env - Update request for key: ${key} for account: ${account}`);
  try {
    if (!key || typeof value === "undefined") {
      winston.warn(`[PUT] /functions/${functionName}/env - Key and value are required.`);
      return res.status(400).json({ message: "Key and value are required." });
    }
    const awsConfig = getAwsConfigForAccount(account);
    const lambda = new AWS.Lambda(awsConfig);
    // Get current env vars
    const config = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();
    const envVars = config.Environment?.Variables || {};
    if (!(key in envVars)) {
      winston.warn(`[PUT] /functions/${functionName}/env - Key does not exist: ${key}`);
      return res.status(400).json({ message: "Key does not exist." });
    }
    envVars[key] = value;
    await lambda.updateFunctionConfiguration({
      FunctionName: functionName,
      Environment: { Variables: envVars }
    }).promise();
    winston.info(`[PUT] /functions/${functionName}/env - Environment variable updated: ${key} for account: ${account}`);
    res.json({ message: "Environment variable updated." });
  } catch (err) {
    winston.error(`[PUT] /functions/${functionName}/env - Error: ${err}`);
    res.status(500).json({ message: "Failed to update environment variable." });
  }
});

// Get CloudWatch logs for a Lambda function
router.post("/functions/:functionName/logs", auth, async (req, res) => {
  const { functionName } = req.params;
  const { startDate, endDate, keyword, nextToken, account } = req.body;
  winston.info(`[POST] /functions/${functionName}/logs - Fetching logs for account: ${account}...`);
  try {
    // Select AWS credentials/config based on account
    const awsConfig = getAwsConfigForAccount(account || "test");
    const cloudwatchlogs = new AWS.CloudWatchLogs(awsConfig);
    const logGroupName = `/aws/lambda/${functionName}`;
    const params = {
      logGroupName,
      startTime: startDate ? new Date(startDate).getTime() : undefined,
      endTime: endDate ? new Date(endDate).getTime() : undefined,
      filterPattern: keyword ? keyword : undefined,
      limit: 50,
      nextToken
    };
    // Remove undefined keys
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    const data = await cloudwatchlogs.filterLogEvents(params).promise();
    winston.info(`[POST] /functions/${functionName}/logs - Success: ${data.events.length} events fetched for account: ${account}.`);
    res.json({ events: data.events, nextToken: data.nextToken });
  } catch (err) {
    winston.error(`[POST] /functions/${functionName}/logs - Error: ${err} | Stack: ${err.stack}`);
    res.status(500).json({ message: "Failed to fetch logs.", error: err.message, stack: err.stack });
  }
});

export default router;