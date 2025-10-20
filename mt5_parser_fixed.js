// Parser corregido para MT5 HTML Reports
// Copiar y reemplazar la función parseMT5HTMLReport completa

async function parseMT5HTMLReport(htmlContent) {
    console.log('📄 Procesando informe HTML de MetaTrader 5...');
    
    try {
        // Parsear HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extraer nombre de cuenta del informe
        const accountNameElement = doc.querySelector('th b');
        const defaultAccountName = accountNameElement ? accountNameElement.textContent.trim() : 'MT5 Account';
        
        // Buscar la tabla de Posiciones (closed trades)
        let positionsTable = null;
        const tables = doc.querySelectorAll('table');
        
        for (const table of tables) {
            // Buscar por el header específico de la tabla de Posiciones
            const headers = table.querySelectorAll('th');
            let hasPosicionesHeader = false;
            
            for (const header of headers) {
                const text = header.textContent.trim();
                if (text === 'Posiciones' || text === 'Positions') {
                    hasPosicionesHeader = true;
                    break;
                }
            }
            
            if (hasPosicionesHeader) {
                // Verificar que tenga filas de datos
                const dataRows = table.querySelectorAll('tr[bgcolor]');
                if (dataRows.length > 0) {
                    positionsTable = table;
                    console.log('✅ Tabla de Posiciones encontrada');
                    break;
                }
            }
        }
        
        if (!positionsTable) {
            showSyncNotification('❌ No se encontró la tabla de Posiciones en el informe', 'error');
            return;
        }
        
        // Extraer filas de datos (las que tienen bgcolor - son las operaciones)
        const rows = positionsTable.querySelectorAll('tr[bgcolor]');
        console.log(`📊 Encontradas ${rows.length} posiciones cerradas en el informe`);
        
        if (rows.length === 0) {
            showSyncNotification('ℹ️ El informe no contiene posiciones cerradas', 'info');
            return;
        }
        
        const newOperations = [];
        let skippedCount = 0;
        
        // Buscar o crear cuenta MT5
        let mt5Account = DB.accounts.find(acc => acc.name.toLowerCase().includes('mt5') || acc.platform === 'meta-trader-5');
        
        if (!mt5Account) {
            // Crear cuenta automáticamente
            mt5Account = {
                id: generateId(),
                name: defaultAccountName,
                balance: 0,
                currency: 'USD',
                platform: 'meta-trader-5'
            };
            DB.accounts.push(mt5Account);
            await dexieDB.accounts.add(mt5Account);
            console.log('✅ Cuenta MT5 creada automáticamente:', mt5Account.name);
        }
        
        // Procesar cada fila de posición cerrada
        for (const row of rows) {
            try {
                const cells = row.querySelectorAll('td');
                
                // Log para debug
                console.log(`🔍 Procesando fila con ${cells.length} celdas`);
                
                // Verificar cantidad mínima de celdas
                if (cells.length < 12) {
                    console.warn(`⚠️ Fila con solo ${cells.length} celdas, omitiendo`);
                    skippedCount++;
                    continue;
                }
                
                // Extraer datos básicos (estructura de tabla Posiciones de MT5)
                const openDateTime = cells[0].textContent.trim();
                const positionId = cells[1].textContent.trim();
                const symbol = cells[2].textContent.trim();
                const type = cells[3].textContent.trim().toLowerCase();
                
                console.log(`📝 Pos#${positionId}: ${symbol} ${type}`);
                
                // FILTRAR: Solo buy y sell
                if (!symbol || !type || (type !== 'buy' && type !== 'sell')) {
                    console.log(`⏭️ Omitiendo: símbolo="${symbol}", tipo="${type}"`);
                    skippedCount++;
                    continue;
                }
                
                // Extraer volumen y precios
                const volume = parseFloat(cells[4].textContent.replace(/\s/g, '').replace(',', '.')) || 0;
                const entryPrice = parseFloat(cells[5].textContent.replace(/\s/g, '').replace(',', '.')) || 0;
                const exitPrice = parseFloat(cells[9].textContent.replace(/\s/g, '').replace(',', '.')) || 0;
                const closeDateTime = cells[8].textContent.trim();
                
                // Extraer comisión y swap
                const commissionRaw = parseFloat(cells[10].textContent.replace(/\s/g, '').replace(',', '.')) || 0;
                const swapRaw = parseFloat(cells[11].textContent.replace(/\s/g, '').replace(',', '.')) || 0;
                
                // Extraer profit (última celda con número)
                let profit = 0;
                for (let i = cells.length - 1; i >= 12; i--) {
                    const text = cells[i].textContent.replace(/\s/g, '').replace(',', '.');
                    const value = parseFloat(text);
                    if (!isNaN(value)) {
                        profit = value;
                        break;
                    }
                }
                
                console.log(`💰 Vol=${volume}, Entry=${entryPrice}, Exit=${exitPrice}, P&L=${profit}, Comm=${commissionRaw}, Swap=${swapRaw}`);
                
                // FILTRAR: profit = 0 o precios inválidos
                if (profit === 0 || entryPrice === 0 || exitPrice === 0) {
                    console.log(`⏭️ Omitiendo: P&L=${profit}, Entry=${entryPrice}, Exit=${exitPrice}`);
                    skippedCount++;
                    continue;
                }
                
                // Parsear fechas
                const [openDateStr, openTimeStr] = openDateTime.split(' ');
                const [closeDateStr, closeTimeStr] = closeDateTime.split(' ');
                
                // Convertir YYYY.MM.DD a YYYY-MM-DD
                const operationDate = closeDateStr.replace(/\./g, '-');
                
                // Validar formato de fecha
                if (!/^\d{4}-\d{2}-\d{2}$/.test(operationDate)) {
                    console.error(`❌ Fecha inválida: "${operationDate}"`);
                    skippedCount++;
                    continue;
                }
                
                // Calcular fees (solo valores razonables < $100)
                let totalFees = 0;
                if (Math.abs(commissionRaw) < 100) totalFees += Math.abs(commissionRaw);
                if (Math.abs(swapRaw) < 100) totalFees += Math.abs(swapRaw);
                
                // Determinar resultado
                const result = profit > 0 ? 'win' : (profit < 0 ? 'loss' : 'breakeven');
                
                // Crear operación
                const operation = {
                    id: `mt5_${positionId}`,
                    date: operationDate,
                    accountId: mt5Account.id,
                    instrument: symbol,
                    type: type,
                    entry: entryPrice,
                    exit: exitPrice,
                    entryTime: openTimeStr || null,
                    exitTime: closeTimeStr || null,
                    volume: volume,
                    result: result,
                    pl: profit,
                    currency: mt5Account.currency,
                    notes: `Importado de MT5 - Posición #${positionId}`,
                    imageDatas: [],
                    fees: totalFees,
                    manualPL: profit,
                    session: 'No especificado'
                };
                
                // Verificar duplicados
                if (DB.operations.some(op => op.id === operation.id)) {
                    console.log(`⏭️ Operación #${positionId} ya existe`);
                    skippedCount++;
                    continue;
                }
                
                console.log(`✅ Operación válida: ${symbol} ${type} | ${operationDate} | $${profit}`);
                newOperations.push(operation);
                
            } catch (error) {
                console.error('Error procesando fila:', error);
                skippedCount++;
            }
        }
        
        if (newOperations.length === 0) {
            showSyncNotification('❌ No se pudieron procesar operaciones válidas', 'error');
            return;
        }
        
        // Guardar en DB
        try {
            await dexieDB.operations.bulkAdd(newOperations);
            DB.operations.push(...newOperations);
            
            // Sincronizar con Supabase
            if (currentUser) {
                console.log('🔍 Sincronizando con Supabase...');
                let successCount = 0;
                
                for (const operation of newOperations) {
                    try {
                        // Verificar si ya existe en Supabase
                        const { data: existing } = await supabase
                            .from('operations')
                            .select('id')
                            .eq('id', operation.id)
                            .eq('user_id', currentUser.id)
                            .single();
                        
                        if (existing) {
                            console.log(`⏭️ Operación ${operation.id} ya existe en Supabase`);
                            continue;
                        }
                        
                        await saveOperationToSupabase(operation);
                        successCount++;
                    } catch (error) {
                        if (!error.message?.includes('duplicate')) {
                            console.error('❌ Error sincronizando:', error);
                            addToSyncQueue(operation, 'operation');
                        }
                    }
                }
                
                console.log(`✅ ${successCount} operaciones sincronizadas`);
            }
            
            // Actualizar vistas
            updateAccountBalances();
            refreshAllViews();
            
            showSyncNotification(
                `✅ ${newOperations.length} operaciones importadas desde MT5${skippedCount > 0 ? ` (${skippedCount} omitidas)` : ''}`,
                'success'
            );
            
            console.log(`✅ Importación completada: ${newOperations.length} operaciones, ${skippedCount} omitidas`);
            
        } catch (error) {
            console.error('Error guardando operaciones:', error);
            showSyncNotification('❌ Error guardando operaciones: ' + error.message, 'error');
        }
        
    } catch (error) {
        console.error('Error parseando informe MT5:', error);
        showSyncNotification('❌ Error procesando informe HTML', 'error');
    }
}
