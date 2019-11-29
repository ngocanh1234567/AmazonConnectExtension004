import AWS = require("aws-sdk");

const transcribeservice = new AWS.TranscribeService();
const outputBucket = process.env.OUTPUT_BUCKET!;
 
exports.handler = async (event: any) => {
  console.log(JSON.stringify(event));

  await Promise.all(event.Records.map( async (record:any) => {
    
    // Job名は、オブジェクト名をもとに生成
    const tmp = record.s3.object.key.split('-');
    const jobName = tmp[tmp.length-1];
    console.log(`jobName: ${jobName}`);

    var params = {
      LanguageCode: 'ja-JP',
      Media: {
        MediaFileUri: `s3://${record.s3.bucket.name}/${record.s3.object.key}`
      },
      TranscriptionJobName: jobName,
      MediaFormat: 'wav',
      OutputBucketName: outputBucket,
      Settings: {
        ChannelIdentification: true, // チャンネル情報有効
      }
    };
    await transcribeservice.startTranscriptionJob(params).promise();
  }))
}
 
