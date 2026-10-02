import React, { useState } from 'react';
import { View, Pressable, Image, Modal } from 'react-native';
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
        accessibilityLabel={`AI Persona: ${selected.displayName}`}
        className={[
          'flex-row items-center self-start bg-background-card rounded-full border border-khaki-200 py-1 px-2 gap-2 shadow-bubble',
          disabled ? 'opacity-50' : 'active:opacity-85',
        ].join(' ')}
      >
        {selected.profileImageUrl ? (
          <Image source={{ uri: selected.profileImageUrl }} className="w-7 h-7 rounded-full" />
        ) : (
          <View className="w-7 h-7 rounded-full bg-primary-100 items-center justify-center">
            <Ionicons
              name={selected.code === 'elean' ? 'woman' : 'man'}
              size={16}
              color={theme.colors.primary[600]}
            />
          </View>
        )}
        <Text variant="body" weight="semibold" className="text-sm">
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
        <Pressable
          className="flex-1 bg-black/25 justify-start items-start pt-[110px] pl-4"
          onPress={() => setVisible(false)}
        >
          <View className="bg-background-card rounded-md border border-khaki-200 py-1 min-w-[200px] shadow-elevated">
            {agents.map((agent) => {
              const isActive = agent.code === selectedCode;
              return (
                <Pressable
                  key={agent.agentId}
                  onPress={() => handleSelect(agent.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${agent.displayName}`}
                  className={[
                    'flex-row items-center py-2 px-3 gap-3',
                    isActive ? 'bg-primary-50' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {agent.profileImageUrl ? (
                    <Image source={{ uri: agent.profileImageUrl }} className="w-8 h-8 rounded-full" />
                  ) : (
                    <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
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
                    className="flex-1"
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
