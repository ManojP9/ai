// audio.cpp — Task 3: audio path bring-up.
// Mic: I2S RX from the SPH0645 (reports signal level — proves capture works).
// Speaker: a LEDC PWM tone on PIN_AUDIO_OUT.
//
// NOTE: the ESP32-S3 has no DAC and the BOM's PAM8403 is an analog-input amp, so
// real PCM playback needs an I2S DAC amp (e.g. MAX98357A). The PWM tone below is a
// pragmatic "does the speaker make sound" check; swap in I2S TX once a DAC amp is
// on the board.
#include "bringup.h"
#include "pins.h"
#include "config.h"
#include <driver/i2s.h>

namespace bringup {

static bool micReady = false;
static const i2s_port_t MIC_PORT = I2S_NUM_0;

void audioInit() {
  i2s_config_t cfg = {};
  cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
  cfg.sample_rate = MIC_SAMPLE_RATE;
  cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT;   // SPH0645 packs 24-bit in 32-bit slots
  cfg.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
  cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  cfg.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
  cfg.dma_buf_count = 4;
  cfg.dma_buf_len = 256;
  cfg.use_apll = false;

  i2s_pin_config_t pins = {};
  pins.bck_io_num = PIN_MIC_SCK;
  pins.ws_io_num = PIN_MIC_WS;
  pins.data_out_num = I2S_PIN_NO_CHANGE;
  pins.data_in_num = PIN_MIC_SD;

  if (i2s_driver_install(MIC_PORT, &cfg, 0, nullptr) == ESP_OK &&
      i2s_set_pin(MIC_PORT, &pins) == ESP_OK) {
    micReady = true;
    Serial.println(F("  mic I2S RX ready"));
  } else {
    Serial.println(F("  mic I2S init FAILED"));
  }
}

void micCaptureTest() {
  Serial.println(F("\n[3a] MIC CAPTURE"));
  if (!micReady) { Serial.println(F("  mic not initialised")); return; }

  const int N = 256;
  int32_t buf[N];
  size_t bytesRead = 0;
  const uint32_t end = millis() + MIC_CAPTURE_MS;
  int64_t peak = 0; double sumSq = 0; uint32_t samples = 0;

  Serial.println(F("  make some noise..."));
  while (millis() < end) {
    if (i2s_read(MIC_PORT, buf, sizeof(buf), &bytesRead, 100) == ESP_OK) {
      const int n = bytesRead / sizeof(int32_t);
      for (int i = 0; i < n; i++) {
        const int32_t s = buf[i] >> 14;          // shift out unused low bits
        if (llabs(s) > peak) peak = llabs(s);
        sumSq += (double)s * s; samples++;
      }
    }
  }
  const double rms = samples ? sqrt(sumSq / samples) : 0;
  Serial.printf("  samples=%u  peak=%lld  rms=%.1f\n", samples, (long long)peak, rms);
  Serial.println(rms > 50 ? F("  -> mic OK (signal detected)")
                          : F("  -> low/no signal; check wiring & SEL pin"));
}

void speakerToneTest() {
  Serial.println(F("\n[3b] SPEAKER TONE (PWM)"));
  const int ch = 0;
  ledcSetup(ch, 1000 /*Hz*/, 8 /*bits*/);
  ledcAttachPin(PIN_AUDIO_OUT, ch);
  const int notes[] = { 880, 988, 1047, 1175 };
  for (int f : notes) { ledcWriteTone(ch, f); delay(180); }
  ledcWriteTone(ch, 0);
  ledcDetachPin(PIN_AUDIO_OUT);
  Serial.println(F("  played 4-note chime (swap to I2S DAC amp for PCM playback)"));
}

} // namespace bringup
