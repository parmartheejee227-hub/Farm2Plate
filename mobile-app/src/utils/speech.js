import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export const voiceAssistant = {
  /**
   * Speak in Hindi (hi-IN) with fallback to Web Speech Synthesis
   */
  speakInHindi: async (text, onDone = null) => {
    try {
      // Stop any prior speech
      await voiceAssistant.stop();

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        if (onDone) utterance.onend = onDone;
        window.speechSynthesis.speak(utterance);
        return;
      }

      Speech.speak(text, {
        language: 'hi-IN',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => {
          if (onDone) onDone();
        },
        onError: (e) => {
          console.warn('Speech error:', e);
        }
      });
    } catch (err) {
      console.warn('Voice playback failed:', err);
    }
  },

  /**
   * Stop speech playback
   */
  stop: async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else {
        await Speech.stop();
      }
    } catch {}
  },

  /**
   * Spoken Hindi generator for Farmer Harvest Batch
   */
  getBatchVoiceText: (batch, farmerName = 'किसान भाई') => {
    const crop = batch.crop_name_hi || batch.crop_name;
    const avail = parseFloat(batch.available_qty_kg);
    const price = parseFloat(batch.farmer_price_per_kg);
    const mandi = parseFloat(batch.mandi_rate_per_kg);
    const gain = (price - mandi).toFixed(0);

    return `नमस्ते ${farmerName} जी। आपकी फसल ${crop} की बची हुई मात्रा ${avail} किलो उपलब्ध है। आपका तय मूल्य ${price} रुपये प्रति किलो है, जो मंडी भाव से ${gain} रुपये ज्यादा है।`;
  },

  /**
   * Spoken Hindi generator for Order & Escrow
   */
  getOrderVoiceText: (order, farmerName = 'किसान भाई') => {
    const crop = order.crop_name_hi || order.crop_name;
    const qty = parseFloat(order.ordered_qty_kg);
    const amount = parseFloat(order.total_amount);
    const status = order.escrow_status === 'VERIFIED_RELEASED'
      ? 'सत्यापित होकर आपके खाते में जमा हो चुकी है'
      : 'एस्क्रो में सुरक्षित रखी गई है। गेट पर जांच होते ही रिलीज होगी।';

    return `${farmerName} जी, ${crop} के ${qty} किलो का ऑर्डर मिला है। कुल ${amount} रुपये की राशि ${status}`;
  },

  /**
   * Spoken Hindi generator for Wallet Balance
   */
  getWalletVoiceText: (farmerName, balance) => {
    return `${farmerName} जी, आपके फार्म2प्लेट वॉलेट में कुल ${balance} रुपये उपलब्ध हैं। यह पूरी राशि सीधे आपके बैंक खाते में भेजी जा सकती है।`;
  }
};
