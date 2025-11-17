#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { WirelabContactApiStack } from "../lib/wirelab-contact-api-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "eu-west-1",
};

new WirelabContactApiStack(app, "WirelabContactApiStack", {
  env,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
});
