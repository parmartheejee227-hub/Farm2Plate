import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { voiceAssistant } from '../utils/speech';

export default function VoiceSpeechButton({ speechText, label = 'आवाज़ में सुनें', lang = 'hi' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggle = async () => {
    if (isSpeaking) {
      await voiceAssistant.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await voiceAssistant.speakInHindi(speechText, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, isSpeaking && styles.btnActive]}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{isSpeaking ? '🔊' : '📢'}</Text>
      <Text style={[styles.text, isSpeaking && styles.textActive]}>
        {isSpeaking ? (lang === 'hi' ? 'आवाज़ रोकें' : 'Stop Audio') : (lang === 'hi' ? label : 'Listen Hindi')}
      </Text>
      {isSpeaking && <View style={styles.pulseDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  btnActive: {
    backgroundColor: '#059669',
    borderColor: '#047857'
  },
  icon: {
    fontSize: 14
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46'
  },
  textActive: {
    color: '#ffffff'
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399'
  }
});
