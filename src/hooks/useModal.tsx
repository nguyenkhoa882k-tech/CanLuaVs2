import { useState } from 'react';

interface ModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

interface ModalConfig {
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  buttons?: ModalButton[];
  children?: React.ReactNode;
}

export const useModal = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    title: '',
    message: '',
  });

  const showModal = (modalConfig: ModalConfig) => {
    setConfig(modalConfig);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  return {
    visible,
    config,
    showModal,
    hideModal,
  };
};
