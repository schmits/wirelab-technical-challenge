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
  frontendOrigins?: string[];
}

export class WirelabContactApiStack extends Stack {
  public readonly functionUrl: string;

  constructor(scope: Construct, id: string, props?: WirelabContactApiStackProps) {
    super(scope, id, props);

    const frontendOrigins = props?.frontendOrigins ??
      (props?.frontendOrigin ? [props.frontendOrigin] : [
        "http://localhost:3000",
        "http://localhost:3001",
      ]);

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
      description: "Handles contact form submissions and dashboard metadata for the Wirelab technical challenge",
    });

    const url = contactHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: frontendOrigins,
        allowedMethods: [
          lambda.HttpMethod.GET,
          lambda.HttpMethod.POST,
          lambda.HttpMethod.OPTIONS,
        ],
        allowedHeaders: ["content-type"],
      },
    });

    this.functionUrl = url.url;

    new CfnOutput(this, "ContactFunctionUrl", {
      value: url.url,
      description: "Public URL for the contact API Lambda function",
      exportName: "WirelabContactFunctionUrl",
    });

    Tags.of(this).add("project", "wirelab-contact-poc");
    Tags.of(this).add("owner", "rian-schmits");
  }
}