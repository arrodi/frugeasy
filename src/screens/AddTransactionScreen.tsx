import { useState } from 'react';
import { Alert, InputAccessoryView, Keyboard, LayoutAnimation, Platform, Pressable, StyleSheet, Text, TextInput, UIManager, View } from 'react-native';
import { TransactionCategory, TransactionType } from '../domain/types';

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
  onSave: () => Promise<boolean>;
  onCreateRecurring: (input: { frequency: 'weekly' | 'monthly'; label: string }) => Promise<void>;
};

export function AddTransactionScreen({ darkMode, nameInput, amountInput, selectedType, selectedCategory, categoryOptions, onChangeName, onChangeAmount, onChangeType, onChangeCategory, onSave, onCreateRecurring }: Props) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [freq, setFreq] = useState<'none' | 'weekly' | 'monthly'>('none');
  const amountAccessoryId = 'amountKeyboardAccessory';

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const onPressSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    setIsSaving(true);
    try {
      const ok = await onSave();
      if (ok && advanced && freq !== 'none') {
        await onCreateRecurring({ frequency: freq, label: nameInput.trim() || `${selectedCategory} recurring` });
      }
    } finally { setIsSaving(false); }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.heroWrap}><Text style={[styles.sectionTitle, darkMode && styles.textDark]}>Transact!</Text></View>
      <View style={[styles.formArea, darkMode && styles.formAreaDark]}>
        <TextInput value={amountInput} onChangeText={onChangeAmount} keyboardType="decimal-pad" returnKeyType="done" blurOnSubmit onSubmitEditing={() => Keyboard.dismiss()} inputAccessoryViewID={Platform.OS === 'ios' ? amountAccessoryId : undefined} placeholder="Amount" placeholderTextColor={darkMode ? '#86a893' : '#3e5f47'} style={[styles.input, darkMode && styles.inputDark]} />

        <View style={[styles.switchWrap, darkMode && styles.switchWrapDark]}>
          <Pressable onPress={() => onChangeType('income')} style={[styles.switchOption, selectedType === 'income' && styles.switchOptionActive]}><Text style={[styles.switchText, selectedType === 'income' && styles.switchTextActive]}>Income</Text></Pressable>
          <Pressable onPress={() => onChangeType('expense')} style={[styles.switchOption, selectedType === 'expense' && styles.switchOptionActive]}><Text style={[styles.switchText, selectedType === 'expense' && styles.switchTextActive]}>Expense</Text></Pressable>
        </View>

        <Text style={[styles.label, darkMode && styles.textDark]}>Category</Text>
        <View>
          <Pressable style={[styles.dropdownTrigger, darkMode && styles.inputDark]} onPress={() => setCategoryOpen((p) => !p)}>
            <Text style={[styles.dropdownTriggerText, darkMode && styles.textDark]}>{selectedCategory}</Text>
            <Text style={styles.dropdownChevron}>{categoryOpen ? '▴' : '▾'}</Text>
          </Pressable>
          {categoryOpen ? (
            <View style={[styles.dropdownMenu, darkMode && styles.formAreaDark]}>
              {categoryOptions.map((category) => (
                <Pressable key={category} onPress={() => { onChangeCategory(category); setCategoryOpen(false); }} style={[styles.dropdownOption, category === selectedCategory && styles.dropdownOptionActive]}>
                  <Text style={[styles.dropdownOptionText, darkMode && styles.textDark]}>{category}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.advancedBtn, darkMode && styles.inputDark]}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAdvanced((v) => !v);
          }}
        >
          <Text style={[styles.advancedText, darkMode && styles.textDark]}>{advanced ? 'Hide Advanced Options' : 'Advanced Options'}</Text>
        </Pressable>

        {advanced ? (
          <>
            <Text style={[styles.label, darkMode && styles.textDark]}>Name (optional)</Text>
            <TextInput value={nameInput} onChangeText={onChangeName} placeholder="e.g. Lunch, Salary" placeholderTextColor={darkMode ? '#86a893' : '#3e5f47'} style={[styles.input, darkMode && styles.inputDark]} />
            <Text style={[styles.label, darkMode && styles.textDark]}>Recurrence</Text>
            <View style={styles.rowGap}>
              {(['none','weekly','monthly'] as const).map((f)=><Pressable key={f} style={[styles.pill, freq===f&&styles.pillActive]} onPress={()=>setFreq(f)}><Text style={[styles.pillText, freq===f&&styles.pillTextActive]}>{f}</Text></Pressable>)}
            </View>
          </>
        ) : null}

        <Pressable style={styles.saveBtn} onPress={onPressSave}><Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save transaction'}</Text></Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={amountAccessoryId}><View style={styles.accessoryBar}><Pressable onPress={() => Keyboard.dismiss()} style={styles.doneTypingButton}><Text style={styles.doneTypingText}>Done</Text></Pressable></View></InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  heroWrap: { width: '100%', maxWidth: 520, height: 90, alignItems: 'center', justifyContent: 'center' },
  formArea: { width: '100%', maxWidth: 520, backgroundColor: '#f3fff6', borderWidth: 1, borderColor: '#b8efc4', borderRadius: 18, padding: 16, gap: 14 },
  formAreaDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  sectionTitle: { fontSize: 44, fontWeight: '900', color: '#166534', letterSpacing: 0.4 },
  textDark: { color: '#d6f5df' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#86d89d', color: '#14532d', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '600' },
  inputDark: { backgroundColor: '#0f1a14', borderColor: '#2e4d3b', color: '#d6f5df' },
  switchWrap: { flexDirection: 'row', backgroundColor: '#e8f8ee', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#b6e9c3', gap: 4 },
  switchWrapDark: { backgroundColor: '#1a2d22', borderColor: '#2e4d3b' },
  switchOption: { flex: 1, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  switchOptionActive: { backgroundColor: '#16a34a' },
  switchText: { color: '#1e6e37', fontWeight: '700', fontSize: 16 },
  switchTextActive: { color: 'white' },
  label: { color: '#166534', fontWeight: '700', fontSize: 16 },
  dropdownTrigger: { minHeight: 52, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#9dddad', backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownTriggerText: { color: '#14532d', fontWeight: '600', fontSize: 18 },
  dropdownChevron: { color: '#2b7a42', fontSize: 16 },
  dropdownMenu: { marginTop: 6, borderRadius: 12, borderWidth: 1, borderColor: '#b0e8be', overflow: 'hidden', backgroundColor: 'white' },
  dropdownOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e3f6e8' },
  dropdownOptionActive: { backgroundColor: '#e4fce9' },
  dropdownOptionText: { color: '#1e6e37', fontWeight: '600', fontSize: 16 },
  advancedBtn:{borderWidth:1,borderColor:'#9dddad',borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:'#ecfff1'}, advancedText:{color:'#166534',fontWeight:'700'},
  rowGap:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  pill:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:'#a9e6b7',backgroundColor:'#f0fff4'}, pillActive:{backgroundColor:'#14b85a',borderColor:'#14b85a'}, pillText:{color:'#1e6e37',fontWeight:'600'}, pillTextActive:{color:'white'},
  saveBtn: { marginTop: 'auto', backgroundColor: '#16a34a', borderWidth: 1, borderColor: '#15803d', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 18 },
  accessoryBar: { backgroundColor: '#e5faeb', borderTopWidth: 1, borderTopColor: '#b9ebc7', paddingHorizontal: 12, paddingVertical: 8, alignItems: 'flex-end' },
  doneTypingButton: { backgroundColor: '#d2f5dc', borderWidth: 1, borderColor: '#98dda9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  doneTypingText: { color: '#14632f', fontWeight: '700' },
});
