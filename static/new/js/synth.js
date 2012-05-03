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


    var Instruments = function(audiolet, url) {
        AudioletGroup.apply(this, [audiolet, 0, 1]);

        this.synth = new Synth(audiolet);
        this.bass = new Synth(audiolet);
        this.bd = new Drum(audiolet, 'audio/bd_stereo.wav');
        this.sn = new Drum(audiolet, 'audio/sn_stereo.wav');
        this.hh = new Drum(audiolet, 'audio/hh_stereo.wav');


        this.synthFrequencyPattern = new PSequence([70, 66, 72, 66, 75, 66, 77, -1, 80, -1, 90, -1],Infinity);
        this.bassFrequencyPattern = new PSequence([30, -1, 32, -1, 35, -1, 37, -1, 30, -1, 30, -1],Infinity);
        this.kickPattern = new PSequence([1, 0, 0, 0],Infinity);
        this.snarePattern = new PSequence([0, 1, 0, 1],Infinity);
        this.hhPattern = new PSequence([1, 1, 1, 1],Infinity);
        this.synthDurationPattern = new PSequence([0.9, 0.1], Infinity);
        this.bassDurationPattern = new PSequence([0.9, 0.1], Infinity);
        this.schedulerFunction = function(freq, gate) {
                if (freq >= 0) {
                    this.saw.frequency.setValue(mtof(freq));
                    this.env.gate.setValue(1);
                } else {
                    this.env.gate.setValue(0);
                }
            };
        this.drumSchedulerFunction = function(volume) {
            this.gain.gain.setValue(volume);
            this.trigger.trigger.setValue(1);
        };
        audiolet.scheduler.play([this.synthFrequencyPattern], this.synthDurationPattern, this.schedulerFunction.bind(this.synth));
        audiolet.scheduler.play([this.bassFrequencyPattern], this.bassDurationPattern, this.schedulerFunction.bind(this.bass));
        audiolet.scheduler.play([this.kickPattern], 0.5, this.drumSchedulerFunction.bind(this.bd));
        audiolet.scheduler.play([this.snarePattern], 0.5, this.drumSchedulerFunction.bind(this.sn));
        audiolet.scheduler.play([this.hhPattern], 0.5, this.drumSchedulerFunction.bind(this.hh));
        this.hh.finalgain.gain.setValue(0.5);




        // The rest of the pipeline
        this.mainEffectsFeed = new Gain(audiolet);
        this.preeffectsGain = new Gain(audiolet, 0.6);
        this.bitcrush = new BitCrusher(audiolet, 5);
        this.reverb = new Reverb(audiolet, 0.5, 1, 0.3);
        this.posteffectsGain = new Gain(audiolet, 1.0);
        this.synth.connect(this.mainEffectsFeed);
        this.bass.connect(this.mainEffectsFeed);
        this.bd.connect(this.mainEffectsFeed);
        this.sn.connect(this.mainEffectsFeed);
        this.hh.connect(this.mainEffectsFeed);
        this.mainEffectsFeed.connect(this.preeffectsGain);
        this.preeffectsGain.connect(this.bitcrush);
        this.bitcrush.connect(this.reverb);
        this.reverb.connect(this.posteffectsGain);
        this.posteffectsGain.connect(this.outputs[0]);

    }
    extend(Instruments, AudioletGroup);
    audiolet = new Audiolet();
    synth = new Instruments(audiolet);

    synth.connect(audiolet.output);


};

var synth;
var audiolet;

function clamp(low, high,  value) { return Math.max(low, Math.min(high, value)) };

function setReverbMix(value) { synth.reverb.mix.setValue(clamp(0,1,value)); }
function setReverbRoom(value) { synth.reverb.roomSize.setValue(value); }
function setReverbDamping(value) { synth.reverb.damping.setValue(value); }
function setBitcrushBits(value) { synth.bitcrush.bits.setValue(value); }
function setPreEffectsVol(value) { synth.preeffectsGain.gain.setValue(value); }
function setPostEffectsVol(value) { synth.posteffectsGain.gain.setValue(value); }
function setTempo(value) { audiolet.scheduler.setTempo(value); }



var parameters = {
   preeffectsvol: {set:setPreEffectsVol, name:"preeffectsvol", title:"Pre Effects Volume", max:1.0, min:0.0, curve:"linear", units:"", category:"effects"},
   reverbmix: {set:setReverbMix, name:"reverbmix", title:"Reverb Mix", max:1.0, min:0.0, curve:"linear", units:"", category:"effects"},
   reverbroom: {set:setReverbRoom, name:"reverbroom", title:"Reverb Room", max:1.0, min:0.0, curve:"linear", units:"", category:"effects"},
   reverbdamping: {set:setReverbDamping, name:"reverbdamping", title:"Reverb Damping", max:1.0, min:0.0, curve:"linear", units:"", category:"effects"},
   bitcrushbits: {set:setBitcrushBits, name:"bitcrushbits", title:"Bitcrush", max:32.0, min:1.0, curve:"linear", units:"bits", category:"effects"},
   posteffectsvol: {set:setPostEffectsVol, name:"posteffectsvol", title:"Post Effects Volume", max:1.0, min:0.0, curve:"linear", units:"", category:"main"},
   tempo: {set:setTempo, name:"tempo", title:"Tempo", max:300.0, min:20.0, curve:"linear", units:"bpm", category:"main"},
}



function mtof(midi) {
    return Math.pow(2, (midi-69)/12)*440.0;
}
