import {
  Stack,
  StackProps,
  Duration,
  CfnOutput,
  Tags,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export interface WirelabContactApiStackProps extends StackProps {
  frontendOrigin?: string;
}

export class WirelabContactApiStack extends Stack {
  public readonly functionUrl: string;

  constructor(scope: Construct, id: string, props?: WirelabContactApiStackProps) {
    super(scope, id, props);

    const frontendOrigin = props?.frontendOrigin ?? "http://localhost:3000";

    const contactHandler = new NodejsFunction(this, "ContactHandlerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../../../apps/backend/src/handler.ts"),
      handler: "handler",
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        NODE_ENV: "production",
      },
      description: "Handles dashboard form submissions for the Wirelab technical challenge",
    });

    const url = contactHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: [frontendOrigin],
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
        allowedHeaders: ["content-type"],
      },
    });

    this.functionUrl = url.url;

    new CfnOutput(this, "ContactFunctionUrl", {
      value: url.url,
      description: "Public URL for the dashboard Lambda function",
      exportName: "WirelabContactFunctionUrl",
    });

    Tags.of(this).add("project", "wirelab-dashboard-poc");
    Tags.of(this).add("owner", "rian-schmits");
  }
}
