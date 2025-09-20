import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message = 'Loading...',
  overlay = true,
  size = 'large',
  color = '#007AFF'
}) => {
  if (!visible) {
    return null;
  }

  const content = (
    <View style={[styles.container, overlay && styles.overlay]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        statusBarTranslucent
      >
        {content}
      </Modal>
    );
  }

  return content;
};

interface InlineLoadingProps {
  loading: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  message = 'Loading...',
  size = 'small',
  color = '#007AFF',
  style
}) => {
  if (!loading) {
    return null;
  }

  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

interface LoadingButtonProps {
  loading: boolean;
  title: string;
  loadingTitle?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  title,
  loadingTitle = 'Loading...',
  onPress,
  disabled = false,
  style,
  textStyle
}) => {
  return (
    <View style={[styles.button, style, (loading || disabled) && styles.buttonDisabled]}>
      {loading ? (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, textStyle]}>{loadingTitle}</Text>
        </View>
      ) : (
        <Text 
          style={[styles.buttonText, textStyle]}
          onPress={loading || disabled ? undefined : onPress}
        >
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spinnerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoadingSpinner;