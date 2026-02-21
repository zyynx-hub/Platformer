#!/usr/bin/env python3
"""Generate simple UI sound effects as WAV files for the menu system."""

import wave
import struct
import math
import os

SAMPLE_RATE = 44100
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "sfx")


def generate_wav(filename: str, samples: list[float], sample_rate: int = SAMPLE_RATE):
    """Write mono 16-bit WAV file from float samples [-1.0, 1.0]."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            f.writeframes(struct.pack("<h", int(clamped * 32767)))
    print(f"  Written: {filepath}")


def generate_tick():
    """Short bright tick — sine burst at 1000 Hz, 50ms, fast exponential decay."""
    freq = 1000.0
    duration = 0.05
    amplitude = 0.4
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        envelope = math.exp(-t * 50.0)
        sample = math.sin(2.0 * math.pi * freq * t) * envelope * amplitude
        samples.append(sample)
    generate_wav("ui_tick.wav", samples)


def generate_confirm():
    """Two-note ascending chime — C5 then E5, 150ms total, slight overlap."""
    c5 = 523.25
    e5 = 659.25
    note_dur = 0.08
    gap = 0.01
    amplitude = 0.35
    total_dur = note_dur + gap + note_dur
    n_samples = int(total_dur * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        sample = 0.0
        # First note (C5)
        if t < note_dur:
            env1 = math.exp(-t * 25.0)
            sample += math.sin(2.0 * math.pi * c5 * t) * env1 * amplitude
        # Second note (E5), starts after gap
        t2_start = note_dur + gap
        if t >= t2_start:
            t2 = t - t2_start
            env2 = math.exp(-t2 * 20.0)
            sample += math.sin(2.0 * math.pi * e5 * t2) * env2 * amplitude
        samples.append(sample)
    generate_wav("ui_confirm.wav", samples)


def generate_rocket_thrust():
    """Loopable retro rocket thruster — deep rumble with layered harmonics and noise.

    Multi-layer approach for a convincing pixel-art rocket:
    1. Deep sawtooth fundamental (55 Hz) for engine rumble
    2. Square sub-harmonic (27.5 Hz) for bass body
    3. Pulse wave (110 Hz, 25% duty) for mid-range buzz
    4. Heavy filtered noise (50%) for combustion roar
    5. Slow LFO modulation for organic flutter
    Duration: 1.0s loop, sample-aligned for seamless repeat.
    """
    fund_freq = 55.0       # A1 — deep rumble
    sub_freq = 27.5        # A0 — sub-bass
    mid_freq = 110.0       # A2 — mid buzz
    amplitude = 0.45
    duration = 1.0

    # Round to exact fundamental period for seamless loop
    period_samples = int(SAMPLE_RATE / fund_freq)
    n_samples = period_samples * max(1, int(duration * SAMPLE_RATE) // period_samples)

    samples = []
    phase_fund = 0.0
    phase_sub = 0.0
    phase_mid = 0.0
    phase_lfo = 0.0
    noise_state = 42
    prev_noise_filtered = 0.0

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        phase_fund += fund_freq / SAMPLE_RATE
        phase_sub += sub_freq / SAMPLE_RATE
        phase_mid += mid_freq / SAMPLE_RATE
        phase_lfo += 3.5 / SAMPLE_RATE  # 3.5 Hz flutter

        # LFO: slow amplitude wobble for organic feel
        lfo = 0.85 + 0.15 * math.sin(2.0 * math.pi * phase_lfo)

        # Sawtooth fundamental (ramp wave)
        saw = 2.0 * (phase_fund % 1.0) - 1.0

        # Square sub-harmonic (50% duty)
        sub = 1.0 if (phase_sub % 1.0) < 0.5 else -1.0

        # Pulse wave mid (25% duty — narrower = buzzier)
        pulse = 1.0 if (phase_mid % 1.0) < 0.25 else -1.0

        # Deterministic noise via LCG
        noise_state = (noise_state * 1103515245 + 12345) & 0x7FFFFFFF
        raw_noise = (noise_state / 0x7FFFFFFF) * 2.0 - 1.0

        # Simple low-pass filter on noise (smooths harsh hiss into roar)
        alpha = 0.15  # lower = smoother
        prev_noise_filtered = alpha * raw_noise + (1.0 - alpha) * prev_noise_filtered

        # Mix layers: saw 30%, sub 15%, pulse 15%, noise 40%
        mix = (
            saw * 0.30
            + sub * 0.15
            + pulse * 0.15
            + prev_noise_filtered * 0.40
        )

        sample = mix * amplitude * lfo
        samples.append(sample)

    generate_wav("rocket_thrust.wav", samples)


def generate_dash_swoosh():
    """Short airy swoosh — filtered noise sweep with rising pitch, ~120ms.

    Layers:
    1. Band-passed noise that sweeps from 800 Hz to 3000 Hz (air rush)
    2. Quick attack (5ms), fast exponential decay
    3. Slight pitch-down tail for the trailing air
    """
    duration = 0.12
    amplitude = 0.35
    n_samples = int(duration * SAMPLE_RATE)
    noise_state = 7

    # Two-pole bandpass state
    bp_y1 = 0.0
    bp_y2 = 0.0
    bp_x1 = 0.0
    bp_x2 = 0.0

    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        progress = t / duration  # 0..1

        # Envelope: fast attack (5ms), exponential decay
        if t < 0.005:
            env = t / 0.005
        else:
            env = math.exp(-(t - 0.005) * 25.0)

        # Sweep center frequency 800 → 3000 Hz (fast rise, slow tail)
        sweep = 800.0 + 2200.0 * (1.0 - (1.0 - progress) ** 3)

        # Bandpass filter coefficients (resonant)
        bw = sweep * 0.6  # bandwidth
        omega = 2.0 * math.pi * sweep / SAMPLE_RATE
        sin_w = math.sin(omega)
        cos_w = math.cos(omega)
        alpha = sin_w * math.sinh(math.log(2.0) / 2.0 * (bw / sweep) * omega / sin_w) if sin_w != 0 else 0.1

        b0 = alpha
        b1 = 0.0
        b2 = -alpha
        a0 = 1.0 + alpha
        a1 = -2.0 * cos_w
        a2 = 1.0 - alpha

        # Deterministic noise
        noise_state = (noise_state * 1103515245 + 12345) & 0x7FFFFFFF
        raw_noise = (noise_state / 0x7FFFFFFF) * 2.0 - 1.0

        # Apply bandpass
        y = (b0 / a0) * raw_noise + (b1 / a0) * bp_x1 + (b2 / a0) * bp_x2 - (a1 / a0) * bp_y1 - (a2 / a0) * bp_y2
        bp_x2 = bp_x1
        bp_x1 = raw_noise
        bp_y2 = bp_y1
        bp_y1 = y

        sample = y * env * amplitude
        samples.append(sample)

    generate_wav("dash_swoosh.wav", samples)


def generate_dialog_talk():
    """Animal Crossing-style speech blip — ~60ms voiced syllable.

    Mimics a tiny vocal utterance:
    1. Pulse wave glottal source (rich harmonics, like vocal cords)
    2. Two-formant vowel shaping (F1=600 Hz, F2=1200 Hz) for "ah" quality
    3. Tiny noise burst at attack (consonant-like pop)
    4. Quick open/close envelope (mouth shape)
    Pitch randomization at runtime via pitch_scale (0.8-1.4).
    """
    freq = 220.0          # fundamental — low voice range
    duration = 0.06
    amplitude = 0.45
    n_samples = int(duration * SAMPLE_RATE)
    noise_state = 31

    # Formant filter state (two resonant bandpass filters in series)
    f1_freq, f1_bw = 600.0, 120.0   # first formant (open vowel)
    f2_freq, f2_bw = 1200.0, 150.0  # second formant

    # Biquad bandpass coefficients
    def biquad_bp(center, bw):
        omega = 2.0 * math.pi * center / SAMPLE_RATE
        sin_w = math.sin(omega)
        cos_w = math.cos(omega)
        alpha = sin_w * math.sinh(math.log(2.0) / 2.0 * (bw / center) * omega / sin_w) if sin_w != 0 else 0.1
        a0 = 1.0 + alpha
        return {
            "b0": alpha / a0, "b1": 0.0, "b2": -alpha / a0,
            "a1": -2.0 * cos_w / a0, "a2": (1.0 - alpha) / a0,
        }

    c1 = biquad_bp(f1_freq, f1_bw)
    c2 = biquad_bp(f2_freq, f2_bw)
    # Filter states
    f1_x1 = f1_x2 = f1_y1 = f1_y2 = 0.0
    f2_x1 = f2_x2 = f2_y1 = f2_y2 = 0.0

    samples = []
    phase = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        progress = t / duration

        # Envelope: mouth opens fast, sustains briefly, closes
        if progress < 0.08:
            env = progress / 0.08                       # 5ms attack
        elif progress < 0.55:
            env = 1.0                                    # sustain
        else:
            env = 1.0 - ((progress - 0.55) / 0.45) ** 1.5  # smooth close

        # Glottal pulse source (narrow pulse wave, ~20% duty = buzzy/nasal)
        phase += freq / SAMPLE_RATE
        pulse = 1.0 if (phase % 1.0) < 0.20 else -0.3

        # Tiny noise burst in first 8ms (consonant attack)
        noise_state = (noise_state * 1103515245 + 12345) & 0x7FFFFFFF
        noise = (noise_state / 0x7FFFFFFF) * 2.0 - 1.0
        noise_env = max(0.0, 1.0 - t / 0.008) * 0.4 if t < 0.008 else 0.0

        # Mix source
        src = pulse + noise * noise_env

        # Formant 1 (bandpass)
        y1 = c1["b0"] * src + c1["b1"] * f1_x1 + c1["b2"] * f1_x2 - c1["a1"] * f1_y1 - c1["a2"] * f1_y2
        f1_x2 = f1_x1; f1_x1 = src; f1_y2 = f1_y1; f1_y1 = y1

        # Formant 2 (bandpass, parallel mix)
        y2 = c2["b0"] * src + c2["b1"] * f2_x1 + c2["b2"] * f2_x2 - c2["a1"] * f2_y1 - c2["a2"] * f2_y2
        f2_x2 = f2_x1; f2_x1 = src; f2_y2 = f2_y1; f2_y1 = y2

        # Combine formants (F1 dominant, F2 adds brightness)
        voiced = y1 * 0.7 + y2 * 0.3

        samples.append(voiced * env * amplitude)

    generate_wav("dialog_talk.wav", samples)


if __name__ == "__main__":
    import sys
    print("Generating UI sound effects...")
    generate_tick()
    generate_confirm()
    generate_dash_swoosh()
    generate_dialog_talk()
    # rocket_thrust.wav is user-provided — only regenerate with --all flag
    if "--all" in sys.argv:
        generate_rocket_thrust()
        print("  (rocket_thrust.wav regenerated — user-provided WAV overwritten!)")
    print("Done.")
