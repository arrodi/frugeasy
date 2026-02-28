import { useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { TransactionCategory, TransactionType } from '../domain/types';
import { getThemeColors, radii, spacing, typography } from '../ui/themeTokens';

type Props = {
  darkMode?: boolean;
  nameInput: string;
  amountInput: string;
  selectedType: TransactionType;
  selectedCategory: TransactionCategory;
  categoryOptions: TransactionCategory[];
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeType: (value: TransactionType) => void;
  onChangeCategory: (value: TransactionCategory) => void;
  onSave: (input?: { dateIso?: string }) => Promise<boolean>;
  onCreateRecurring: (input: { frequency: 'weekly' | 'monthly'; label: string }) => Promise<void>;
};

export function AddTransactionScreen({
  darkMode,
  nameInput,
  amountInput,
  selectedType,
  selectedCategory,
  categoryOptions,
  onChangeName,
  onChangeAmount,
  onChangeType,
  onChangeCategory,
  onSave,
  onCreateRecurring,
}: Props) {
  const colors = getThemeColors(darkMode);
  const [isSaving, setIsSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [freq, setFreq] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [categoryChosen, setCategoryChosen] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const amountInputRef = useRef<TextInput>(null);
  const amountAccessoryId = 'amountKeyboardAccessory';

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const onPressSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    let dateIso: string | undefined;
    if (useCustomDate && customDateInput.trim()) {
      const parsed = new Date(customDateInput.trim());
      if (Number.isNaN(parsed.getTime())) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid date', 'Use a valid date/time (e.g. 2026-02-26 14:30).');
        return;
      }
      dateIso = parsed.toISOString();
    }

    setIsSaving(true);
    try {
      const ok = await onSave({ dateIso });
      if (ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaveDone(true);
        setTimeout(() => setSaveDone(false), 900);
        amountInputRef.current?.focus();
      }
      if (ok && advanced && freq !== 'none') {
        await onCreateRecurring({ frequency: freq, label: nameInput.trim() || `${selectedCategory} recurring` });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}> 
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Add transaction</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Quick entry first. Details optional.</Text>

        <TextInput
          ref={amountInputRef}
          value={amountInput}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
          inputAccessoryViewID={Platform.OS === 'ios' ? amountAccessoryId : undefined}
          placeholder="Amount"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        />

        <Pressable style={[styles.inputButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setTypeModalOpen(true)}>
          <Text style={[styles.inputButtonText, { color: colors.text }]}>{selectedType === 'income' ? 'Income' : 'Expense'}</Text>
        </Pressable>

        <Pressable style={[styles.inputButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setCategoryModalOpen(true)}>
          <Text style={[styles.inputButtonText, { color: colors.text }]}>{categoryChosen ? selectedCategory : 'Category'}</Text>
        </Pressable>

        {advanced ? (
          <>
            <TextInput
              value={nameInput}
              onChangeText={onChangeName}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />

            <Pressable style={[styles.inputButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setRecurrenceModalOpen(true)}>
              <Text style={[styles.inputButtonText, { color: colors.text }]}>{freq === 'none' ? 'Recurrence' : freq === 'monthly' ? 'Monthly' : 'Weekly'}</Text>
            </Pressable>

            <Pressable style={[styles.inputButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setUseCustomDate((v) => !v)}>
              <Text style={[styles.inputButtonText, { color: colors.text }]}>{useCustomDate ? 'Custom date: ON' : 'Use custom date/time'}</Text>
            </Pressable>

            {useCustomDate ? (
              <TextInput
                value={customDateInput}
                onChangeText={setCustomDateInput}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />
            ) : null}
          </>
        ) : null}

        <Pressable style={[styles.cta, { backgroundColor: saveDone ? colors.primaryStrong : colors.primary }]} onPress={onPressSave}>
          <Text style={styles.ctaText}>{isSaving ? 'Saving…' : saveDone ? 'Saved ✓' : 'Save transaction'}</Text>
        </Pressable>

        <Pressable
          style={styles.advancedToggle}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAdvanced((v) => !v);
          }}
        >
          <Text style={[styles.advancedToggleText, { color: colors.textMuted }]}>{advanced ? 'Hide advanced options' : 'Show advanced options'}</Text>
        </Pressable>
      </View>

      <Modal visible={typeModalOpen} animationType="fade" transparent onRequestClose={() => setTypeModalOpen(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setTypeModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select type</Text>
            {(['expense', 'income'] as const).map((type) => {
              const selected = type === selectedType;
              return (
                <Pressable key={type} style={[styles.modalOption, { borderColor: colors.border, backgroundColor: selected ? colors.primary : colors.surfaceMuted }]} onPress={() => { onChangeType(type); setTypeModalOpen(false); }}>
                  <Text style={[styles.modalOptionText, { color: selected ? '#fff' : colors.text }]}>{type === 'income' ? 'Income' : 'Expense'}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={recurrenceModalOpen} animationType="fade" transparent onRequestClose={() => setRecurrenceModalOpen(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setRecurrenceModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select recurrence</Text>
            {(['none', 'weekly', 'monthly'] as const).map((r) => {
              const selected = r === freq;
              return (
                <Pressable key={r} style={[styles.modalOption, { borderColor: colors.border, backgroundColor: selected ? colors.primary : colors.surfaceMuted }]} onPress={() => { setFreq(r); setRecurrenceModalOpen(false); }}>
                  <Text style={[styles.modalOptionText, { color: selected ? '#fff' : colors.text }]}>{r === 'none' ? 'None' : r === 'weekly' ? 'Weekly' : 'Monthly'}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={categoryModalOpen} animationType="fade" transparent onRequestClose={() => setCategoryModalOpen(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setCategoryModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select category</Text>
            <View style={styles.grid}>
              {categoryOptions.map((category) => {
                const selected = category === selectedCategory;
                return (
                  <Pressable key={category} style={[styles.gridTile, { borderColor: colors.border, backgroundColor: selected ? colors.primary : colors.surfaceMuted }]} onPress={() => { onChangeCategory(category); setCategoryChosen(true); setCategoryModalOpen(false); }}>
                    <Text style={[styles.gridTileText, { color: selected ? '#fff' : colors.text }]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={amountAccessoryId}>
          <View style={[styles.accessory, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Pressable onPress={() => Keyboard.dismiss()} style={[styles.accessoryBtn, { backgroundColor: colors.surface }]}>
              <Text style={[styles.accessoryBtnText, { color: colors.text }]}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.body, marginTop: -4 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.section, fontWeight: '600' },
  inputButton: { minHeight: 50, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  inputButtonText: { fontSize: typography.body, fontWeight: '600' },
  cta: { borderRadius: radii.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: typography.section },
  advancedToggle: { alignItems: 'center', paddingTop: spacing.xs },
  advancedToggleText: { fontSize: typography.caption, fontWeight: '600' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 520, borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  modalTitle: { fontSize: typography.section, fontWeight: '800', marginBottom: spacing.xs },
  modalOption: { minHeight: 46, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalOptionText: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridTile: { width: '31%', minHeight: 50, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gridTileText: { fontWeight: '700' },
  accessory: { borderTopWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'flex-end' },
  accessoryBtn: { borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  accessoryBtnText: { fontWeight: '700' },
});
