function playExample() {
    var Synth = function(audiolet) {
        AudioletGroup.apply(this, [audiolet, 0, 1]);
        // Basic wave
        this.saw = new Saw(audiolet, 100);

        // Filter
        this.filter = new LowPassFilter(audiolet, 1000);

        // Gain envelope
        this.gain = new Gain(audiolet);
        this.env = new ADSREnvelope(audiolet,
                                    1, // Gate
                                    0.1, // Attack
                                    0.1, // Decay
                                    0.9, // Sustain
                                    0.1); // Release

        // Main signal path
        this.saw.connect(this.filter);
        this.filter.connect(this.gain);
        this.gain.connect(this.outputs[0]);


        // Envelope
        this.env.connect(this.gain, 0, 1);
    };
    extend(Synth, AudioletGroup);

    var Drum = function(audiolet, url) {
        AudioletGroup.apply(this, [audiolet, 0, 1]);
        // Create empty buffers for the bass drum, hi hat and snare drum
        this.snd = new AudioletBuffer(1, 0);
        // Load wav files using synchronous XHR
        this.snd.load(url, false);
        // Create buffer players
        this.player = new BufferPlayer(audiolet, this.snd, 1, 0, 0);
        // Create trigger to re-trigger the playback of samples
        this.trigger = new TriggerControl(audiolet);
        // Create gain objects to control the individual gain of samples
        this.gain = new Gain(audiolet, 1.00);
        this.finalgain = new Gain(audiolet, 1.00);
        // Create pan objects to control the individual gain of samples
        this.pan = new Pan(audiolet, 0.45);
        // output of trigger to input of player
        this.trigger.connect(this.player, 0, 1);
        // output of player to input of gain
        this.player.connect(this.gain);
        // output of gain to input of pan
        this.gain.connect(this.finalgain);
        this.finalgain.connect(this.pan);
        // output of pan to general output
        // all three signals will be added together when connected to the output
        this.pan.connect(this.outputs[0]);
    }
    extend(Drum, AudioletGroup);

    var audiolet = new Audiolet();
    var synth = new Synth(audiolet);
    var bass = new Synth(audiolet);


    //drumsss
    // Create empty buffers for the bass drum, hi hat and snare drum
    var bd = new Drum(audiolet, 'audio/bd_stereo.wav');
    var sn = new Drum(audiolet, 'audio/sn_stereo.wav');
    var hh = new Drum(audiolet, 'audio/hh_stereo.wav');




    var synthFrequencyPattern = new PSequence([70, 66, 72, 66, 75, 66, 77, -1, 80, -1, 90, -1],Infinity);
    var bassFrequencyPattern = new PSequence([30, -1, 32, -1, 35, -1, 37, -1, 30, -1, 30, -1],Infinity);
    var kickPattern = new PSequence([1, 0, 0, 0],Infinity);
    var snarePattern = new PSequence([0, 1, 0, 1],Infinity);
    var hhPattern = new PSequence([1, 1, 1, 1],Infinity);
    var synthDurationPattern = new PSequence([0.9, 0.1], Infinity);
    var bassDurationPattern = new PSequence([0.9, 0.1], Infinity);
    var schedulerFunction = function(freq, gate) {
            if (freq >= 0) {
                this.saw.frequency.setValue(mtof(freq));
                this.env.gate.setValue(1);
            } else {
                this.env.gate.setValue(0);
            }
        };
    var drumSchedulerFunction = function(volume) {
        this.gain.gain.setValue(volume);
        this.trigger.trigger.setValue(1);
    };
    audiolet.scheduler.play([synthFrequencyPattern], synthDurationPattern, schedulerFunction.bind(synth));
    audiolet.scheduler.play([bassFrequencyPattern], bassDurationPattern, schedulerFunction.bind(bass));
    audiolet.scheduler.play([kickPattern], 0.5, drumSchedulerFunction.bind(bd));
    audiolet.scheduler.play([snarePattern], 0.5, drumSchedulerFunction.bind(sn));
    audiolet.scheduler.play([hhPattern], 0.5, drumSchedulerFunction.bind(hh));
    hh.finalgain.gain.setValue(0.5);




    // The rest of the pipeline
    var mainEffectsFeed = new Gain(audiolet);
    var preeffectsGain = new Gain(audiolet, 0.6);
    var bitcrush = new BitCrusher(audiolet, 5);
    var reverb = new Reverb(audiolet, 0.5, 1, 0.3);
    var posteffectsGain = new Gain(audiolet, 1.0);
    synth.connect(mainEffectsFeed);
    bass.connect(mainEffectsFeed);
    bd.connect(mainEffectsFeed);
    sn.connect(mainEffectsFeed);
    hh.connect(mainEffectsFeed);
    mainEffectsFeed.connect(preeffectsGain);
    preeffectsGain.connect(bitcrush);
    bitcrush.connect(reverb);
    reverb.connect(posteffectsGain);
    posteffectsGain.connect(audiolet.output);


    setReverbMix = function(value) {
        reverb.mix.setValue(value);
    }
};


var setReverbMix;


function mtof(midi) {
    return Math.pow(2, (midi-69)/12)*440.0;
}
