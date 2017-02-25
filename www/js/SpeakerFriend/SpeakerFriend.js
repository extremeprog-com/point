SpeakerFriend = {

    playing: false,

    urls: {
        EN: 'http://voice.mindboost.me/voice2.mindboost.me/voice/translate_tts?ie=UTF-8&total=1&idx=0&client=t&pitch=-105&prev=input&q=%text%&tl=en',
        RU: 'http://voice.mindboost.me/voice2.mindboost.me/voice/translate_tts?ie=UTF-8&total=1&idx=0&client=t&pitch=-75&prev=input&q=%text%&tl=ru'
    },

    play: function() {
        var request = CatchRequest(SpeakerUser_SayRq);

        var _this = this;

        return function(success) {
            _this.playing = true;
            libs.SpeakerFriend.cb_fragment_text_start = function(phrase) {
                FireEvent(new Speaker_FragmentStart({fragment: phrase.replace(/\[\[slnc.*?\]\]/g, '')}));
            };
            libs.SpeakerFriend.cb_fragment_end = function() {
                FireEvent(new Speaker_FragmentEnd());
            };
            libs.SpeakerFriend.playText(request.text, function() {_this.playing = false; success();});
        }

    }
    , cancel: function() {
        CatchRequest(SpeakerUser_CancelRq);

        var _this = this;

        return function(success, fail) {
            _this.playing = true;
            libs.SpeakerFriend.cancel();
            success();
        }
    },
    tokenize: function() {
        var request = CatchRequest(SpeakerUser_TokenizeRq);
        var phrase = request.phrase;
        return function(cb) {
            var phrases = [];

            //console.log(phrase);

            if(phrase.length <= 90) {
                phrases = [phrase]
            } else {
                if(phrase.indexOf('|') === -1) {
                    phrase = phrase.replace(/ *(\.+|!+|\?+) */g, "$1|");
                }
                phrases = phrase.split('|').filter(function(x){return !x.match(/^[.?,! ]*$/)});

                //phrases.map(function(phrase, index){
                //    if(phrase.length > 90) {
                //        phrases.splice(index, 1);
                //        phrase.replace(/( *,| *–| *-) */g, "$1|").split('|').map(function(phrase, num) {
                //            phrases.splice(index + num, 0, phrase);
                //        });
                //    }
                //});
            }
            cb(phrases);
        }
    }
};

libs = global.libs || {};

libs.SpeakerFriend = {
    breath_stage: 0,
    //breath_stages_length: [1, 2, 0.7],
    breath_stages_length: [1, 2, 0.7],
    breath_stages_cb: [function(){}, function(){}, function(){} ],
    breath_timer: new Timer,
    cb_fragment_start: function(phrase, duration) {

    },
    cb_fragment_end: function() {

    },
    cb_fragment_text_start: function() {

    },
    breath_start: function() {

        if(typeof window == 'undefined') {
            return;
        }

        var _this = this;

        (function next_breath_stage() {

            if(_this.breath_stages_cb[_this.breath_stage] instanceof Function) {
                _this.breath_stages_cb[_this.breath_stage]();
                _this.breath_stages_cb[_this.breath_stage] = function() { }
            }

            _this.breath_timer.setTime(0);

            function next() {
                _this.breath_stage = (_this.breath_stage + 1) % _this.breath_stages_length.length;
                next_breath_stage();
            }

            if(_this.breath_stages_length[_this.breath_stage]) {
                _this.breath_timer.onTime(_this.breath_stages_length[_this.breath_stage], next);
            } else {
                next();
            }

        })();

        _this.breath_timer.start();

    },
    currentAudioTrack: null,
    playText: function(phrase, cb, cb_fragment_start, cb_fragment_end) {
        var _this = this;

        FireRequest(new SpeakerUser_TokenizeRq({phrase: phrase}), function(phrases) {
            (function playFragment(num) {
                if(phrases[num] !== undefined) {
                    _this.cb_fragment_text_start(phrases[num]);
                    libs.SpeakerFriend._playFragmentText(phrases[num], function() { playFragment(num + 1); });
                } else {
                    _this.breath_stages_length = [1, 2, 0.7];
                    cb && cb();
                }
            })(0);
        });
    },
    letterStage: function() {
        if(this.currentAudioTrack) {
            return Math.sin(( this.currentAudioTrack.currentTime || 0) / 0.12 ) / 2 + 0.5;
        } else {
            return 0;
        }
    },
    _playFragmentText: function(phrase, cb) {
        var _this = this;
        this.cancel();

        this.currentAudioTrack = new Audio((SpeakerFriend.prerender || {})[phrase.trim()]);

        //console.log((SpeakerFriend.prerender || {})[phrase.trim()], phrase.trim());

        this.currentAudioTrack.phrase = phrase;
        var to;
        this.currentAudioTrack.onerror = function(e) {
            //console.log('errorblyasuka', phrase, e);

            var audio = this;
            if(!audio.src.match(/&q=/) ) {
                var lang;
                if(audio.phrase.match(/[абвгдеёжзиклмнопрстуфхчшщыьъэюя]+/i)) {
                    lang = 'ru'
                } else {
                    lang = 'en'
                }
                //console.log(this.dontplay);
                if(!this.dontplay) {

                    //audio.src = 'http://voice.mindboost.me/voice2.mindboost.me/voice/translate_tts?ie=UTF-8&total=1&idx=0&client=t&pitch=' + {ru: -75, en: -105}[lang] + '&prev=input&q=' + audio.phrase.trim() + '&tl=' + lang.toLocaleLowerCase();
                    audio.src = SpeakerFriend.urls[LANG].replace(/%text%/, audio.phrase.trim());
                    to = setTimeout(function() { audio.dontplay = true; FireEvent(new Speaker_NoInternet); }, 2500);

                    var ping_query1 = new XMLHttpRequest();
                    ping_query1.open('GET', 'http://ping1.extremeprog.com/', true);
                    ping_query1.onreadystatechange = function() {
                        if (ping_query1.readyState == 4) {
                            if(ping_query1.status == 200) {
                                if(ping_query1.responseText == 'OK') {
                                    clearTimeout(to);
                                }
                            }
                        }
                    };
                    ping_query1.send();

                    var ping_query2 = new XMLHttpRequest();
                    ping_query2.open('GET', 'http://ping2.extremeprog.com/', true);
                    ping_query2.onreadystatechange = function() {
                        if (ping_query2.readyState == 4) {
                            if(ping_query2.status == 200) {
                                if(ping_query2.responseText == 'OK') {
                                    clearTimeout(to);
                                }
                            }
                        }
                    };
                    ping_query2.send();

                }
            }
        };
        if(!(SpeakerFriend.prerender || {})[phrase.trim()]) {
            this.currentAudioTrack.onerror();
        }
        this.currentAudioTrack.onloadedmetadata = function() {
            clearTimeout(to);
            _this.breath_stages_length[1] = _this.currentAudioTrack.duration;
            _this.breath_stages_cb[1] = function() {
                _this.currentAudioTrack.play();
                setImmediate(function() {
                    _this.cb_fragment_start(phrase, _this.currentAudioTrack.duration);
                });
            };
            _this.breath_stages_cb[2] = function() {
                _this.breath_stages_length[2] = 0;
                _this.breath_stages_length[0] = 0.7;
                setImmediate(function() {
                    _this.cb_fragment_end();
                });
            };
        };
        this.currentAudioTrack.onended = cb;
    },
    cancel: function() {
        if(this.currentAudioTrack) {
            this.currentAudioTrack.pause();
            this.currentAudioTrack.dontplay = true;
            this.currentAudioTrack.src = 'about:blank';
        }
    }
};

libs.SpeakerFriend.breath_start();