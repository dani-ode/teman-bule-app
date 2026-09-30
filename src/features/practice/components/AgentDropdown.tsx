import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgentPersona } from '@/domain/practice/practice.types';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface AgentDropdownProps {
  readonly agents: AgentPersona[];
  readonly selectedCode: string;
  readonly onSelect: (code: string) => void;
  readonly disabled?: boolean;
}

/**
 * Dropdown kecil untuk memilih persona AI TTS (Elean/Willy).
 * Tampil seperti pill: avatar kiri, nama tengah, chevron kanan.
 */
export const AgentDropdown: React.FC<AgentDropdownProps> = ({
  agents,
  selectedCode,
  onSelect,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const selected = agents.find((a) => a.code === selectedCode) ?? agents[0];

  if (!selected) return null;

  const handleSelect = (code: string) => {
    onSelect(code);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Persona AI: ${selected.displayName}`}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
          disabled && styles.triggerDisabled,
        ]}
      >
        {selected.profileImageUrl ? (
          <Image source={{ uri: selected.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons
              name={selected.code === 'elean' ? 'woman' : 'man'}
              size={16}
              color={theme.colors.primary[600]}
            />
          </View>
        )}
        <Text variant="body" weight="semibold" style={styles.name}>
          {selected.displayName}
        </Text>
        <Ionicons
          name={visible ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {agents.map((agent) => {
              const isActive = agent.code === selectedCode;
              return (
                <Pressable
                  key={agent.agentId}
                  onPress={() => handleSelect(agent.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pilih ${agent.displayName}`}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  {agent.profileImageUrl ? (
                    <Image source={{ uri: agent.profileImageUrl }} style={styles.menuAvatar} />
                  ) : (
                    <View style={[styles.menuAvatar, styles.avatarFallback]}>
                      <Ionicons
                        name={agent.code === 'elean' ? 'woman' : 'man'}
                        size={18}
                        color={theme.colors.primary[600]}
                      />
                    </View>
                  )}
                  <Text
                    variant="body"
                    weight={isActive ? 'semibold' : 'regular'}
                    color={isActive ? 'primary' : 'secondary'}
                    style={styles.menuName}
                  >
                    {agent.displayName}
                  </Text>
                  {isActive ? (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary[600]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.khaki[200],
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadows.bubble,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFallback: {
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 110,
    paddingLeft: theme.spacing.lg,
  },
  menu: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.khaki[200],
    paddingVertical: theme.spacing.xs,
    minWidth: 200,
    ...theme.shadows.elevated,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primary[50],
  },
  menuItemPressed: {
    backgroundColor: theme.colors.khaki[100],
  },
  menuAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  menuName: {
    flex: 1,
  },
});
