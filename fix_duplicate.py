# Script para eliminar código duplicado en index.html

import re

file_path = r'c:\Users\Daniel HDZ\Desktop\tradersurvivir su\index.html'

# Leer el archivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y eliminar el bloque duplicado (desde "// Extraer comisión, swap y profit" hasta "continue;\n                }\n                \n                // Parsear fechas")
# Usamos regex para encontrar el bloque completo

pattern = r'(\s+// Extraer comisión, swap y profit\s+const commissionText.*?continue;\s+\}\s+)(// Parsear fechas y horas)'

# Reemplazar dejando solo "// Parsear fechas y horas"
content = re.sub(pattern, r'\2', content, flags=re.DOTALL, count=1)

# Guardar el archivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Código duplicado eliminado correctamente")
