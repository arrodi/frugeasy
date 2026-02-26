import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  transactions: Transaction[];
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (value: 'all' | TransactionType) => void;
  categoryFilter: 'all' | TransactionCategory;
  onCategoryFilterChange: (value: 'all' | TransactionCategory) => void;
  categoryOptions: TransactionCategory[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCsv: () => Promise<void>;
  onUpdateTransaction: (input: { id: string; amount: number; type: TransactionType; category: TransactionCategory; name: string; date: string; }) => Promise<void>;
};

export function TransactionsScreen(props: Props) {
  const { darkMode, currency, transactions, typeFilter, onTypeFilterChange, categoryFilter, onCategoryFilterChange, categoryOptions, searchQuery, onSearchQueryChange, onDeleteTransaction, onExportCsv, onUpdateTransaction } = props;
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Other');
  const [editName, setEditName] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amountDesc' | 'amountAsc'>('newest');

  const shownTransactions = useMemo(() => {
    const arr = [...transactions];
    if (sortBy === 'newest') arr.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sortBy === 'oldest') arr.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (sortBy === 'amountDesc') arr.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amountAsc') arr.sort((a, b) => a.amount - b.amount);
    return arr;
  }, [transactions, sortBy]);

  return (
    <ScrollView style={[styles.screenContainer, darkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topRow}><Text style={[styles.title, darkMode && styles.textDark]}>Transactions</Text><Pressable style={styles.exportBtn} onPress={onExportCsv}><Text style={styles.exportBtnText}>Export CSV</Text></Pressable></View>
      <TextInput value={searchQuery} onChangeText={onSearchQueryChange} placeholder="Search by category, name or amount" placeholderTextColor="#4f7a59" style={[styles.searchInput, darkMode && styles.inputDark]} />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Pressable style={[styles.dropdown, darkMode && styles.inputDark]} onPress={() => setSortOpen((p) => !p)}><Text style={[styles.dropdownText, darkMode && styles.textDark]}>Sort by: {sortBy}</Text><Text>▾</Text></Pressable>
          {sortOpen ? (
            <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
              {(['newest','oldest','amountDesc','amountAsc'] as const).map((o) => <Pressable key={o} style={styles.dropdownOption} onPress={()=>{setSortBy(o); setSortOpen(false);}}><Text style={[styles.dropdownText, darkMode && styles.textDark]}>{o}</Text></Pressable>)}
            </View>
          ) : null}
        </View>
        <View style={styles.flex1}>
          <Pressable style={[styles.dropdown, darkMode && styles.inputDark]} onPress={() => setFilterOpen((p) => !p)}><Text style={[styles.dropdownText, darkMode && styles.textDark]}>Filter: {typeFilter}/{categoryFilter}</Text><Text>▾</Text></Pressable>
          {filterOpen ? (
            <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
              <Text style={styles.section}>Type</Text>
              <View style={styles.filterRow}>{(['all','income','expense'] as const).map((t)=><Pressable key={t} style={[styles.filterChip,typeFilter===t&&styles.filterChipActive]} onPress={()=>onTypeFilterChange(t)}><Text style={[styles.filterChipText,typeFilter===t&&styles.filterChipTextActive]}>{t}</Text></Pressable>)}</View>
              <Text style={styles.section}>Category</Text>
              <View style={styles.filterRow}>{(['all',...categoryOptions] as const).map((cat)=><Pressable key={cat} style={[styles.filterChip,categoryFilter===cat&&styles.filterChipActive]} onPress={()=>onCategoryFilterChange(cat)}><Text style={[styles.filterChipText,categoryFilter===cat&&styles.filterChipTextActive]}>{cat}</Text></Pressable>)}</View>
            </View>
          ) : null}
        </View>
      </View>

      {shownTransactions.map((item) => {
        const editing = editId === item.id;
        return (
          <View key={item.id} style={[styles.listRow, darkMode && styles.listRowDark]}>
            {!editing ? (
              <>
                <View>
                  <Text style={[styles.name, darkMode && styles.textDark]}>{item.name}</Text>
                  <Text style={styles.meta}>{item.category} • {new Date(item.date).toLocaleString()}</Text>
                </View>
                <View style={styles.rightRow}>
                  <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(item.amount, currency)}</Text>
                  <View style={styles.inlineRow}>
                    <Pressable style={styles.actionBtn} onPress={() => { setEditId(item.id); setEditAmount(String(item.amount)); setEditType(item.type); setEditCategory(item.category); setEditName(item.name); }}><Text style={styles.actionBtnText}>Edit</Text></Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => onDeleteTransaction(item.id)}><Text style={styles.actionBtnText}>Delete</Text></Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ width: '100%', gap: 8 }}>
                <TextInput value={editName} onChangeText={setEditName} style={[styles.smallInput, darkMode && styles.inputDark]} placeholder="Name" />
                <View style={styles.inlineRow}><TextInput value={editAmount} onChangeText={setEditAmount} style={[styles.smallInput, darkMode && styles.inputDark]} keyboardType="decimal-pad" placeholder="Amount" /><TextInput value={editCategory} onChangeText={(v)=>setEditCategory(v as TransactionCategory)} style={[styles.smallInput, darkMode && styles.inputDark]} placeholder="Category" /></View>
                <View style={styles.inlineRow}><Pressable style={[styles.filterChip, editType==='income'&&styles.filterChipActive]} onPress={()=>setEditType('income')}><Text style={[styles.filterChipText, editType==='income'&&styles.filterChipTextActive]}>income</Text></Pressable><Pressable style={[styles.filterChip, editType==='expense'&&styles.filterChipActive]} onPress={()=>setEditType('expense')}><Text style={[styles.filterChipText, editType==='expense'&&styles.filterChipTextActive]}>expense</Text></Pressable><Pressable style={styles.actionBtn} onPress={async()=>{const amount=Number(editAmount.replace(',','.')); if(!Number.isFinite(amount)||amount<=0)return; await onUpdateTransaction({id:item.id,amount,type:editType,category:editCategory,name:editName.trim()||'Untitled',date:item.date}); setEditId(null);}}><Text style={styles.actionBtnText}>Save</Text></Pressable></View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer:{flex:1}, screenDark:{backgroundColor:'#0f1a14'}, panelDark:{backgroundColor:'#15251c',borderColor:'#2e4d3b'}, contentContainer:{paddingHorizontal:16,gap:10,paddingTop:8,paddingBottom:24},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, title:{fontSize:17,fontWeight:'700',color:'#156530'}, textDark:{color:'#d6f5df'},
  exportBtn:{backgroundColor:'#14b85a',borderRadius:10,paddingHorizontal:10,paddingVertical:8}, exportBtnText:{color:'white',fontWeight:'700',fontSize:12},
  searchInput:{backgroundColor:'white',borderWidth:1,borderColor:'#b7ebc3',borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:'#156530'}, inputDark:{backgroundColor:'#15251c',borderColor:'#2e4d3b',color:'#d6f5df'},
  row:{flexDirection:'row',gap:8,alignItems:'flex-start'}, flex1:{flex:1}, dropdown:{minHeight:42,borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,paddingHorizontal:10,backgroundColor:'white',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, dropdownText:{color:'#1e6e37',fontWeight:'600',fontSize:12}, dropdownMenu:{marginTop:4,borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,padding:8,gap:6,backgroundColor:'#ecfff1'}, dropdownOption:{paddingVertical:6}, section:{fontSize:12,color:'#2f7a43',fontWeight:'700'},
  smallInput:{flex:1,backgroundColor:'white',borderWidth:1,borderColor:'#b7ebc3',borderRadius:10,paddingHorizontal:10,paddingVertical:8,color:'#156530'},
  inlineRow:{flexDirection:'row',gap:8,alignItems:'center'}, filterRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  filterChip:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:'#a9e6b7',backgroundColor:'#f0fff4'}, filterChipActive:{backgroundColor:'#14b85a',borderColor:'#14b85a'}, filterChipText:{color:'#1e6e37',fontWeight:'600',textTransform:'capitalize'}, filterChipTextActive:{color:'white'},
  listRow:{backgroundColor:'#ecfff1',borderRadius:14,padding:11,borderWidth:1,borderColor:'#9ee5ab',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, listRowDark:{backgroundColor:'#15251c',borderColor:'#2e4d3b'},
  rightRow:{alignItems:'flex-end',gap:6}, name:{fontWeight:'700',color:'#1e6e37'}, meta:{color:'#3e7b52',fontSize:12,marginTop:2}, amount:{color:'#14632f',fontWeight:'700'},
  actionBtn:{backgroundColor:'#e6f8ec',borderWidth:1,borderColor:'#a9e6b7',borderRadius:8,paddingHorizontal:8,paddingVertical:4}, actionBtnText:{color:'#2d7a43',fontSize:12,fontWeight:'700'}
});
