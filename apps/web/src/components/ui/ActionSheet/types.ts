export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ActionSheetButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  hasBorder?: boolean;
}
