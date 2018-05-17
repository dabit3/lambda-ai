var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})
const uuidV4 = require('uuid/v4')

exports.handler = (event, context, callback) => {
  var translate = new AWS.Translate();
  var polly = new AWS.Polly();
  var s3 = new AWS.S3({
    params: {
      Bucket: 'pollyaudio-ndbucket'
    }
  });

  // Step 1 translate the text
  let message = ''
  var translateParams = {
    SourceLanguageCode: event.code,
    TargetLanguageCode: 'de',
    Text: event.sentence
  }
  
  translate.translateText(translateParams, function (err, data) {
    if (err) callback(err)
    message = data.TranslatedText

    var pollyParams = {
      OutputFormat: "mp3", 
      SampleRate: "8000", 
      Text: message,
      TextType: "text", 
      VoiceId: "Joanna"
    };

    polly.synthesizeSpeech(pollyParams, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      
      else  {
        let key = uuidV4()
        var params2 = {
          Key: key,
          ContentType: 'audio/mpeg',
          Body: data.AudioStream,
          ACL: 'public-read'
        };
        s3.putObject(params2, function(err, data) {
          if (err) {
            callback('error putting item: ', err)
          } else {
            callback(null, { sentence: key })
          }
        });
      }
    });
  });  
};
