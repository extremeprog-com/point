var http = require ('http');
var fs = require ('fs');

require ('../lib/Core/Core.js');
require ('../Speaker/Speaker.js');
require ('../js/Timer.js');
require ('./SpeakerFriend.js');

http.globalAgent.maxSockets = 15;

Core.processGlobal();

require('../app2/Mindboost/MindboostOnboardingWelcomeText.js');
require('../HelpMan/HelpManDbExercises.js');
require('../HelpMan/HelpManDb.js');
require('../lang.js');

var phrases = [];

SpeakerFriend.urls = {
  EN: 'http://voice2.mindboost.me/voice/translate_tts?ie=UTF-8&total=1&idx=0&client=t&pitch=-105&prev=input&q=%text%&tl=en',
  RU: 'http://voice2.mindboost.me/voice/translate_tts?ie=UTF-8&total=1&idx=0&client=t&pitch=-75&prev=input&q=%text%&tl=ru'
};

HelpManDb.map(function(it) {
  var text;

  if(it._self.match(new RegExp(global.LANG, 'i'))) {
    if(it.first_text) {
      text = it.first_text;
    }
    else if(it.text) {
      text = it.text;
    }
  }

  if(!text) {
    return;
  }

  if(text.match(/%time/)) {
    [2,5,7,10,15,20,30].map(function(time) {
      FireRequest(new SpeakerUser_TokenizeRq({phrase: text.replace(/%time/, time)}), function(ps) {
        Array.prototype.push.apply(phrases, ps);
      });
    })
  } else {
    FireRequest(new SpeakerUser_TokenizeRq({phrase: text}), function(ps) {
      Array.prototype.push.apply(phrases, ps);
    });
  }
});

Object.keys(MindboostOnboardingWelcomeText).filter(function(it) { return it.match(new RegExp(global.LANG)) }).map(function(lang) {

  var text = MindboostOnboardingWelcomeText[lang];

  if(text.match(/%time/)) {
    [2,5,7,10,15,20,30].map(function(time) {
      FireRequest(new SpeakerUser_TokenizeRq({phrase: text.replace(/%time/, time)}), function(ps) {
        Array.prototype.push.apply(phrases, ps);
      });
    })
  } else {
    FireRequest(new SpeakerUser_TokenizeRq({phrase: text}), function(ps) {
      Array.prototype.push.apply(phrases, ps);
    });
  }
});

fs.writeFile('prerender.js', "SpeakerFriend.prerender = {};\n");

prerender = {};

phrases.map(function(phrase) {

  (function load_phrase() {
    http.get(SpeakerFriend.urls[phrase.match(/[абвгдеёжзиклмнопрстуфхчшщыьъэюя]+/i) ? 'RU' : 'EN'].replace(/%text%/, encodeURIComponent(phrase.trim())), function(res) {
      var body = new Buffer('');
      res.on('data', function(chunk) {
        body = Buffer.concat([body, chunk]);
      });
      res.on('end', function() {

        console.log('loaded: ' + phrase);

        //console.log(body.toString().match(/fatal/i));
        if(body.toString().match(/fatal/i)) {
          console.log('errorka found!', body);
          //fs.appendFile('prerender.js', 'SpeakerFriend.prerender[' + JSON.stringify(phrase) + '] = ' + JSON.stringify('data:audio/mpeg;utf-8,' + body.toString()) + ";\n")
          huihui();
        } else {
          fs.appendFile('prerender.js', 'SpeakerFriend.prerender[' + JSON.stringify(phrase.trim()) + '] = ' + JSON.stringify('data:audio/mpeg;base64,' + body.toString('base64')) + ";\n")
        }


      });
    }).on('error', function() {
      console.log('error loading ' + phrase + ' :( retrying');
      load_phrase();
    })

  })();

});


