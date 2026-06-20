const fs = require('fs');
const path = require('path');

function fixFile(filePath, fixers) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        fixers.forEach(fixer => {
            content = content.replace(fixer.search, fixer.replace);
        });
        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${filePath}`);
    } catch (e) {
        console.error(`Error fixing ${filePath}:`, e);
    }
}

const basePath = path.join('d:', 'expence', 'web-app', 'src', 'components');

fixFile(path.join(basePath, 'AdminDashboard.tsx'), [
    { search: /Users,\s*/, replace: '' },
    { search: /Filter,\s*/, replace: '' },
    { search: /UserPlus,\s*/, replace: '' },
    { search: /MoreHorizontal,\s*/, replace: '' },
    { search: /UserCheck,\s*/, replace: '' },
    { search: /const \[searchTerm, setSearchTerm\] = useState\(''\);/, replace: '' }
]);

fixFile(path.join(basePath, 'AdminLayout.tsx'), [
    { search: /Settings as SettingsIcon,\s*/, replace: '' },
    { search: /ShieldCheck,\s*/, replace: '' }
]);

fixFile(path.join(basePath, 'Dashboard.tsx'), [
    { search: /Plus,\s*/, replace: '' },
    { search: /\.sort\(\(a, b\) => b\.value - a\.value\);/, replace: '.sort((a: any, b: any) => b.value - a.value);' },
    { search: /\{pieData\.map\(\(entry, index\) => \(/, replace: '{pieData.map((_entry, index) => (' },
    { search: /formatter=\{\(value: number\)/, replace: 'formatter={(value: any)' }
]);

fixFile(path.join(basePath, 'GroupDetails.tsx'), [
    { search: /Users,\s*/, replace: '' },
    { search: /Download,\s*/, replace: '' }
]);

fixFile(path.join(basePath, 'LiveChatAdmin.tsx'), [
    { search: /React, /, replace: '' }
]);

fixFile(path.join(basePath, 'Login.tsx'), [
    { search: /Shield,\s*/, replace: '' }
]);

fixFile(path.join(basePath, 'MainLayout.tsx'), [
    { search: /const \[isSidebarOpen, setSidebarOpen\] = useState\(true\);/, replace: 'const [isSidebarOpen] = useState(true);' }
]);

fixFile(path.join(basePath, 'Reports.tsx'), [
    { search: /import \{ formatCurrency \} from '\.\.\/api\/shared\/utils';\s*/, replace: '' },
    { search: /const \[profile, setProfile\] = useState<any>\(null\);\s*/, replace: '' },
    { search: /setProfile\(profileRes\.data\);\s*/, replace: '' },
    { search: /\.sort\(\(a, b\) => b\.value - a\.value\);/, replace: '.sort((a: any, b: any) => b.value - a.value);' },
    { search: /\{pieData\.map\(\(entry, index\) => \(/, replace: '{pieData.map((_entry, index) => (' },
    { search: /formatter=\{\(value: number\)/, replace: 'formatter={(value: any)' }
]);

fixFile(path.join(basePath, 'Support.tsx'), [
    { search: /CheckCircle,\s*/, replace: '' },
    { search: /AlertCircle,\s*/, replace: '' },
    { search: /ChevronRight,\s*/, replace: '' },
    { search: /const \[loading, setLoading\] = useState\(true\);\s*/, replace: '' },
    { search: /setLoading\(true\);\s*/g, replace: '' },
    { search: /setLoading\(false\);\s*/g, replace: '' }
]);

fixFile(path.join(basePath, 'Transactions.tsx'), [
    { search: /Filter,\s*/, replace: '' },
    { search: /category: tx\.category, notes: tx\.notes \|\| '' \}\);/, replace: "category: tx.category, notes: tx.notes || '', transaction_date: tx.transaction_date || new Date().toISOString().split('T')[0] });" }
]);
