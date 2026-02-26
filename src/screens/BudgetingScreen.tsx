import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Budget, CurrencyCode, RecurringRule, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  budgets: Budget[];
  categoryOptions: TransactionCategory[];
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  recurringRules: RecurringRule[];
  onAddRecurringRule: (input: { type: TransactionType; category: TransactionCategory; amount: number; dayOfMonth: number; label: string; }) => Promise<void>;
  onToggleRecurringRule: (id: string, active: boolean) => Promise<void>;
};

export function BudgetingScreen({ darkMode, currency, budgets, categoryOptions, onSaveBudget, recurringRules, onAddRecurringRule, onToggleRecurringRule }: Props) {
  const [tab, setTab] = useState<'budgets' | 'recurring'>('budgets');
  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategoryOpen, setBudgetCategoryOpen] = useState(false);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [expandedBudgetAmount, setExpandedBudgetAmount] = useState('');

  const [ruleLabel, setRuleLabel] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleType, setRuleType] = useState<TransactionType>('expense');
  const [ruleCategory, setRuleCategory] = useState<TransactionCategory>('Food');
  const [ruleDay, setRuleDay] = useState('1');

  return (
    <ScrollView style={[styles.screenContainer, darkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, darkMode && styles.textDark]}>Budgeting</Text>

      <View style={[styles.switchWrap, darkMode && styles.panelDark]}>
        <Pressable style={[styles.switchOption, tab === 'budgets' && styles.switchOptionActive]} onPress={() => setTab('budgets')}><Text style={[styles.switchText, tab === 'budgets' && styles.switchTextActive]}>Budgets</Text></Pressable>
        <Pressable style={[styles.switchOption, tab === 'recurring' && styles.switchOptionActive]} onPress={() => setTab('recurring')}><Text style={[styles.switchText, tab === 'recurring' && styles.switchTextActive]}>Recurring</Text></Pressable>
      </View>

      {tab === 'budgets' ? (
        <>
          <View style={[styles.panel, darkMode && styles.panelDark]}>
            <Text style={[styles.panelTitle, darkMode && styles.textDark]}>Add Budget</Text>
            <Pressable style={[styles.dropdownTrigger, darkMode && styles.inputDark]} onPress={() => setBudgetCategoryOpen((p) => !p)}>
              <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{budgetCategory}</Text>
              <Text style={styles.dropdownChevron}>{budgetCategoryOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {budgetCategoryOpen ? (
              <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                {categoryOptions.map((cat) => (
                  <Pressable key={cat} style={styles.dropdownOption} onPress={() => { setBudgetCategory(cat); setBudgetCategoryOpen(false); }}>
                    <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput value={budgetAmount} onChangeText={setBudgetAmount} style={[styles.input, darkMode && styles.inputDark]} placeholder="Budget amount" keyboardType="decimal-pad" />
            <Pressable style={styles.bigSaveBtn} onPress={async () => {
              const amount = Number(budgetAmount.replace(',', '.'));
              if (!Number.isFinite(amount) || amount <= 0) return;
              await onSaveBudget(budgetCategory, amount);
              setBudgetAmount('');
            }}>
              <Text style={styles.bigSaveText}>Save Budget</Text>
            </Pressable>
          </View>

          <View style={[styles.panel, darkMode && styles.panelDark]}>
            <Text style={[styles.panelTitle, darkMode && styles.textDark]}>All Budgets</Text>
            {budgets.map((b) => (
              <View key={b.id} style={[styles.budgetItem, darkMode && styles.budgetItemDark]}>
                <Pressable onPress={() => { setExpandedBudgetId(expandedBudgetId === b.id ? null : b.id); setExpandedBudgetAmount(String(b.amount)); }} style={styles.budgetHeader}>
                  <Text style={[styles.budgetCat, darkMode && styles.textDark]}>{b.category}</Text>
                  <Text style={[styles.budgetAmt, darkMode && styles.textDark]}>{formatCurrency(b.amount, currency)}</Text>
                </Pressable>
                {expandedBudgetId === b.id ? (
                  <View style={styles.budgetEditRow}>
                    <TextInput value={expandedBudgetAmount} onChangeText={setExpandedBudgetAmount} style={[styles.input, styles.flex1, darkMode && styles.inputDark]} keyboardType="decimal-pad" placeholder="New amount" />
                    <Pressable style={styles.saveBtn} onPress={async () => {
                      const amount = Number(expandedBudgetAmount.replace(',', '.'));
                      if (!Number.isFinite(amount) || amount <= 0) return;
                      await onSaveBudget(b.category, amount);
                      setExpandedBudgetId(null);
                    }}><Text style={styles.saveBtnText}>Update</Text></Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={[styles.panel, darkMode && styles.panelDark]}>
          <Text style={[styles.panelTitle, darkMode && styles.textDark]}>Recurring</Text>
          <TextInput value={ruleLabel} onChangeText={setRuleLabel} style={[styles.input, darkMode && styles.inputDark]} placeholder="Label" />
          <View style={styles.row}><TextInput value={ruleAmount} onChangeText={setRuleAmount} style={[styles.input, styles.flex1, darkMode && styles.inputDark]} placeholder="Amount" keyboardType="decimal-pad" /><TextInput value={ruleDay} onChangeText={setRuleDay} style={[styles.input, styles.flex1, darkMode && styles.inputDark]} placeholder="Day" keyboardType="number-pad" /></View>
          <View style={styles.row}><Pressable style={[styles.pill, ruleType==='income'&&styles.pillActive]} onPress={()=>setRuleType('income')}><Text style={[styles.pillText, ruleType==='income'&&styles.pillTextActive]}>income</Text></Pressable><Pressable style={[styles.pill, ruleType==='expense'&&styles.pillActive]} onPress={()=>setRuleType('expense')}><Text style={[styles.pillText, ruleType==='expense'&&styles.pillTextActive]}>expense</Text></Pressable><TextInput value={ruleCategory} onChangeText={(v)=>setRuleCategory(v as TransactionCategory)} style={[styles.input, styles.flex1, darkMode && styles.inputDark]} placeholder="Category" /></View>
          <Pressable style={styles.bigSaveBtn} onPress={async()=>{const amount=Number(ruleAmount.replace(',','.')); const day=Number(ruleDay); if(!ruleLabel.trim()||!Number.isFinite(amount)||amount<=0||!Number.isFinite(day))return; await onAddRecurringRule({label:ruleLabel.trim(),amount,dayOfMonth:Math.max(1,Math.min(28,Math.round(day))),type:ruleType,category:ruleCategory}); setRuleLabel(''); setRuleAmount(''); setRuleDay('1');}}><Text style={styles.bigSaveText}>Add Recurring</Text></Pressable>
          {recurringRules.map((r)=><View key={r.id} style={styles.ruleRow}><Text style={[styles.ruleText, darkMode&&styles.textDark]}>{r.label} • day {r.dayOfMonth} • {formatCurrency(r.amount,currency)} • {r.category}</Text><Pressable style={styles.saveBtn} onPress={()=>onToggleRecurringRule(r.id,!r.active)}><Text style={styles.saveBtnText}>{r.active?'On':'Off'}</Text></Pressable></View>)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer:{flex:1}, screenDark:{backgroundColor:'#0f1a14'}, contentContainer:{paddingHorizontal:16,gap:10,paddingTop:8,paddingBottom:24},
  title:{fontSize:17,fontWeight:'700',color:'#156530'}, textDark:{color:'#d6f5df'},
  switchWrap:{flexDirection:'row',backgroundColor:'#e8f8ee',borderRadius:12,padding:4,borderWidth:1,borderColor:'#b6e9c3',gap:4},
  switchOption:{flex:1,borderRadius:9,paddingVertical:10,alignItems:'center'},switchOptionActive:{backgroundColor:'#14b85a'},switchText:{color:'#1e6e37',fontWeight:'700'},switchTextActive:{color:'white'},
  panel:{backgroundColor:'#ecfff1',borderWidth:1,borderColor:'#9ee5ab',borderRadius:12,padding:10,gap:8}, panelDark:{backgroundColor:'#15251c',borderColor:'#2e4d3b'},
  panelTitle:{fontWeight:'700',color:'#1e6e37'},
  input:{backgroundColor:'white',borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,paddingHorizontal:10,paddingVertical:10,color:'#156530'}, inputDark:{backgroundColor:'#0f1a14',borderColor:'#2e4d3b',color:'#d6f5df'},
  dropdownTrigger:{minHeight:46,paddingHorizontal:12,borderRadius:10,borderWidth:1,borderColor:'#b7ebc3',backgroundColor:'white',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},dropdownText:{color:'#156530',fontWeight:'600'},dropdownChevron:{color:'#2d7a43'},dropdownMenu:{borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,overflow:'hidden'},dropdownOption:{paddingHorizontal:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#e3f6e8'},
  bigSaveBtn:{backgroundColor:'#14b85a',borderRadius:12,paddingVertical:16,alignItems:'center'}, bigSaveText:{color:'white',fontWeight:'800',fontSize:18},
  budgetItem:{borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,padding:8,backgroundColor:'#f6fff8'}, budgetItemDark:{backgroundColor:'#1a2d22', borderColor:'#2e4d3b'}, budgetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, budgetCat:{fontWeight:'700',color:'#1e6e37'}, budgetAmt:{color:'#14532d',fontWeight:'700'}, budgetEditRow:{flexDirection:'row',gap:8,marginTop:8},
  saveBtn:{backgroundColor:'#14b85a',borderRadius:8,paddingHorizontal:10,paddingVertical:8},saveBtnText:{color:'white',fontWeight:'700',fontSize:12},
  row:{flexDirection:'row',gap:8,alignItems:'center'}, flex1:{flex:1},
  pill:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:'#a9e6b7',backgroundColor:'#f0fff4'}, pillActive:{backgroundColor:'#14b85a',borderColor:'#14b85a'}, pillText:{color:'#1e6e37',fontWeight:'600'}, pillTextActive:{color:'white'},
  ruleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, ruleText:{color:'#35544c',flex:1,marginRight:8}
});
