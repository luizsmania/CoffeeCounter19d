import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBw9JQhm3bjSn8uu2q0OQfYMH5T_jJiT0A",
  authDomain: "dub21-c4bd6.firebaseapp.com",
  databaseURL: "https://dub21-c4bd6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dub21-c4bd6",
  storageBucket: "dub21-c4bd6.appspot.com",
  messagingSenderId: "515778318217",
  appId: "1:515778318217:web:937a7293be912f5628db58",
  measurementId: "G-LPHPQNG58F"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);  // Obtenha a referência do Firestore
const analytics = getAnalytics(app);

// Helper function to get formatted date (DD/MM/YYYY)
function getFormattedDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to process coffee list and generate statistics
function processCoffeeList(coffeeList) {
        let coffeeCount = {};
        let milkCount = {};
        let syrupCount = {};
        let extraCount = {};

        coffeeList.forEach(function (row) {
          if (row.coffee !== 'No Coffee Selected') {
            coffeeCount[row.coffee] = (coffeeCount[row.coffee] || 0) + 1;
          }
          if (row.milk !== 'Regular Milk') {
            milkCount[row.milk] = (milkCount[row.milk] || 0) + 1;
          }
          if (row.syrup !== 'No Syrup') {
            syrupCount[row.syrup] = (syrupCount[row.syrup] || 0) + 1;
          }
          if (row.extra !== 'No Extra') {
            extraCount[row.extra] = (extraCount[row.extra] || 0) + 1;
          }
        });

    return { coffeeCount, milkCount, syrupCount, extraCount };
}

// Upload apenas dos dias especificados (hoje + dia selecionado)
// Salva tanto a lista completa quanto as estatísticas
export async function uploadSelectedDays(selectedDate) {
    const today = getFormattedDate(new Date());
    const datesToUpload = [today];
    
    // Adiciona o dia selecionado se for diferente de hoje
    if (selectedDate && selectedDate !== today) {
        datesToUpload.push(selectedDate);
    }

    console.log("Uploading dates:", datesToUpload);

    // Busca dados existentes do Firestore primeiro
    // IMPORTANTE: Sempre ler antes de escrever para preservar dados existentes
    const coffeeLogsRef = doc(db, "coffee_logs", "dub19downstairs_coffee_logs");
    let existingData = {};
    let readSuccess = false;
    
    try {
        const docSnap = await getDoc(coffeeLogsRef);
        if (docSnap.exists()) {
            existingData = docSnap.data().logs || {};
            readSuccess = true;
            console.log(`Successfully read ${Object.keys(existingData).length} existing dates from Firebase`);
      } else {
            readSuccess = true; // Documento não existe ainda, mas leitura foi bem-sucedida
            console.log("No existing data in Firebase, starting fresh");
        }
    } catch (error) {
        console.error("CRITICAL: Error reading from Firestore:", error);
        // Se não conseguir ler, NÃO faz upload para evitar perder dados
        return { 
            success: false, 
            message: `ERRO CRÍTICO: Não foi possível ler dados existentes do Firebase. Upload cancelado para evitar perda de dados. Erro: ${error.message}` 
        };
    }

    // Processa apenas os dias selecionados
    let newData = {};
    let hasData = false;

    datesToUpload.forEach(date => {
        const coffeeListString = localStorage.getItem(`coffeeList_${date}`);
        
        if (coffeeListString) {
            try {
                const coffeeList = JSON.parse(coffeeListString);
                if (coffeeList.length > 0) {
                    // Processa as estatísticas (formato antigo para compatibilidade)
                    const stats = processCoffeeList(coffeeList);
                    
                    // Mantém o formato antigo como principal (compatível com outro website)
                    // Adiciona fullList como campo opcional para restauração completa
                    newData[date] = {
                        // Formato antigo (compatível) - campos diretos
                        coffeeCount: stats.coffeeCount,
                        milkCount: stats.milkCount,
                        syrupCount: stats.syrupCount,
                        extraCount: stats.extraCount,
                        // Campo adicional opcional para restauração completa (não quebra compatibilidade)
                        fullList: coffeeList
                    };
                    hasData = true;
                }
            } catch (error) {
                console.error(`Error parsing coffee list for ${date}:`, error);
            }
        }
    });

    if (!hasData) {
        console.log("No data to upload for selected dates.");
        return { success: false, message: "Nenhum dado para fazer upload" };
    }

    // Merge com dados existentes (mantém outros dias, atualiza os selecionados)
    // IMPORTANTE: Preserva TODOS os dados existentes, apenas atualiza/adiciona os dias selecionados
    const mergedData = { ...existingData, ...newData };
    
    // Verificação de segurança: garante que não estamos perdendo dados
    const existingDatesCount = Object.keys(existingData).length;
    const mergedDatesCount = Object.keys(mergedData).length;
    
    if (existingDatesCount > 0 && mergedDatesCount < existingDatesCount) {
        console.error("CRITICAL: Merged data has fewer dates than existing data!");
        return { 
            success: false, 
            message: `ERRO: Tentativa de upload poderia resultar em perda de dados. Operação cancelada.` 
        };
    }

    // Faz upload apenas uma vez com todos os dados
    // SEGURANÇA MÁXIMA: 
    // 1. Já lemos os dados existentes (linha 73-79)
    // 2. Já fizemos merge manual (linha 111)
    // 3. Já verificamos que não estamos perdendo dados (linha 116-123)
    // 4. Agora salvamos com setDoc (substitui o documento, mas já contém todos os dados)
    try {
        // Usa setDoc porque já fizemos o merge completo acima
        // O mergedData contém TODOS os dados: existentes + novos
        await setDoc(coffeeLogsRef, { logs: mergedData });
        
        console.log(`✅ Upload seguro concluído. Preservados ${existingDatesCount} data(s) existente(s), atualizado/adicionado ${datesToUpload.length} data(s).`);
        console.log(`📊 Total de datas no Firebase após upload: ${Object.keys(mergedData).length}`);
        
        return { 
            success: true, 
            message: `✅ Upload concluído para: ${datesToUpload.join(', ')}. ${existingDatesCount > 0 ? `✅ ${existingDatesCount} data(s) antiga(s) preservada(s).` : ''} Total: ${Object.keys(mergedData).length} data(s).` 
        };
    } catch (error) {
        console.error("❌ ERRO CRÍTICO no upload:", error);
        return { 
            success: false, 
            message: `❌ Erro no upload: ${error.message}. NENHUM dado foi modificado no Firebase.` 
        };
    }
}

// Download dados do Firebase e atualiza localStorage
export async function downloadFirebaseData() {
    const coffeeLogsRef = doc(db, "coffee_logs", "dub19downstairs_coffee_logs");
    
    try {
        const docSnap = await getDoc(coffeeLogsRef);
        
        if (!docSnap.exists()) {
            return { success: false, message: "Nenhum dado encontrado no Firebase" };
        }

        const firebaseData = docSnap.data().logs || {};
        let downloadedCount = 0;
        let updatedCount = 0;
        let reconstructedCount = 0;
        const downloadedDates = [];
        const updatedDates = [];
        const reconstructedDates = [];

        console.log(`📥 Iniciando download do Firebase. Total de datas encontradas: ${Object.keys(firebaseData).length}`);

        // Para cada data no Firebase, salva a lista completa no localStorage
        Object.keys(firebaseData).forEach(date => {
            const dateData = firebaseData[date];
            
            console.log(`🔍 Processando data ${date}:`, dateData);
            
            // Verifica se tem lista completa ou apenas estatísticas
            let coffeeList = null;
            let isReconstructed = false;
            
            // Prioridade 1: Verifica se tem fullList (campo adicional opcional)
            if (dateData.fullList && Array.isArray(dateData.fullList)) {
                // Tem lista completa - PERFEITO!
                coffeeList = dateData.fullList;
                console.log(`✅ Data ${date}: Lista completa encontrada (${coffeeList.length} cafés)`);
            } 
            // Prioridade 2: Verifica se tem coffeeCount (formato antigo/compatível)
            else if (dateData.coffeeCount || dateData.stats) {
                // Formato antigo/compatível: apenas estatísticas - vamos reconstruir a lista
                console.log(`⚠️ Data ${date}: Apenas estatísticas disponíveis (formato compatível). Reconstruindo lista...`);
                
                // Reconstroi a lista a partir das estatísticas
                coffeeList = [];
                
                // Tenta diferentes formatos de estrutura antiga
                let stats = null;
                if (dateData.stats) {
                    // Formato com stats wrapper
                    stats = dateData.stats;
                } else if (dateData.coffeeCount) {
                    // Formato direto (compatível com outro website) - coffeeCount, milkCount, etc. diretamente
                    stats = {
                        coffeeCount: dateData.coffeeCount || {},
                        milkCount: dateData.milkCount || {},
                        syrupCount: dateData.syrupCount || {},
                        extraCount: dateData.extraCount || {}
                    };
                } else {
                    // Fallback: usa dateData diretamente
                    stats = dateData;
                }
                
                console.log(`📊 Estatísticas para ${date}:`, stats);
                console.log(`📊 Tipo de stats:`, typeof stats);
                console.log(`📊 coffeeCount existe?`, !!stats.coffeeCount);
                console.log(`📊 coffeeCount keys:`, stats.coffeeCount ? Object.keys(stats.coffeeCount) : 'N/A');
                
                // Reconstrói cafés baseado nas contagens
                if (stats && stats.coffeeCount && typeof stats.coffeeCount === 'object') {
                    const coffeeCountKeys = Object.keys(stats.coffeeCount);
                    console.log(`📊 Chaves de coffeeCount:`, coffeeCountKeys);
                    console.log(`📊 Total de tipos de café: ${coffeeCountKeys.length}`);
                    
                    if (coffeeCountKeys.length > 0) {
                        coffeeCountKeys.forEach(coffeeType => {
                            const count = stats.coffeeCount[coffeeType];
                            console.log(`  - ${coffeeType}: ${count} unidade(s) (tipo: ${typeof count})`);
                            
                            // Garante que count é um número
                            const numCount = typeof count === 'number' ? count : parseInt(count, 10);
                            
                            if (isNaN(numCount) || numCount <= 0) {
                                console.warn(`⚠️ Contagem inválida para ${coffeeType}: ${count}`);
                                return;
                            }
                            
                            // Cria um café para cada contagem
                            for (let i = 0; i < numCount; i++) {
                            // Valores padrão
                            let milk = 'Regular Milk';
                            let syrup = 'No Syrup';
                            let extra = 'No Extra';
                            
                            // Tenta usar o primeiro tipo de leite disponível
                            if (stats.milkCount && Object.keys(stats.milkCount).length > 0) {
                                const milkTypes = Object.keys(stats.milkCount);
                                milk = milkTypes[0]; // Usa o primeiro tipo
                            }
                            
                            // Tenta usar o primeiro tipo de syrup disponível
                            if (stats.syrupCount && Object.keys(stats.syrupCount).length > 0) {
                                const syrupTypes = Object.keys(stats.syrupCount);
                                syrup = syrupTypes[0]; // Usa o primeiro tipo
                            }
                            
                            // Tenta usar o primeiro tipo de extra disponível
                            if (stats.extraCount && Object.keys(stats.extraCount).length > 0) {
                                const extraTypes = Object.keys(stats.extraCount);
                                extra = extraTypes[0]; // Usa o primeiro tipo
                            }
                            
                            // Cria o objeto do café no formato esperado
                            const coffeeItem = {
                                coffee: coffeeType,
                                milk: milk,
                                syrup: syrup,
                                extra: extra,
                                time: new Date().toLocaleTimeString(), // Hora aproximada
                                backgroundColor: 'rgba(255, 202, 111, 0.26)'
                            };
                            
                            coffeeList.push(coffeeItem);
                            }
                        });
                    } else {
                        console.warn(`⚠️ Data ${date}: coffeeCount está vazio ou não tem chaves`);
                    }
                } else {
                    console.warn(`⚠️ Data ${date}: stats.coffeeCount não existe ou não é um objeto`);
                    console.warn(`   stats:`, stats);
                    console.warn(`   Tipo de stats.coffeeCount:`, stats ? typeof stats.coffeeCount : 'stats é null');
                }
                
                console.log(`📦 Lista reconstruída tem ${coffeeList.length} itens`);
                
                // Melhora a distribuição de milk, syrup e extra entre os cafés
                // Distribui de forma mais inteligente baseado nas contagens
                if (stats.milkCount && Object.keys(stats.milkCount).length > 0 && coffeeList.length > 0) {
                    const milkTypes = Object.keys(stats.milkCount);
                    const milkCounts = milkTypes.map(type => stats.milkCount[type]);
                    const totalMilk = milkCounts.reduce((a, b) => a + b, 0);
                    
                    let milkIndex = 0;
                    let milkCounter = 0;
                    coffeeList.forEach((item, index) => {
                        if (milkCounter >= milkCounts[milkIndex]) {
                            milkCounter = 0;
                            milkIndex = (milkIndex + 1) % milkTypes.length;
                        }
                        item.milk = milkTypes[milkIndex];
                        milkCounter++;
                    });
                }
                
                if (stats.syrupCount && Object.keys(stats.syrupCount).length > 0 && coffeeList.length > 0) {
                    const syrupTypes = Object.keys(stats.syrupCount);
                    const syrupCounts = syrupTypes.map(type => stats.syrupCount[type]);
                    
                    let syrupIndex = 0;
                    let syrupCounter = 0;
                    coffeeList.forEach((item, index) => {
                        if (syrupCounter >= syrupCounts[syrupIndex]) {
                            syrupCounter = 0;
                            syrupIndex = (syrupIndex + 1) % syrupTypes.length;
                        }
                        item.syrup = syrupTypes[syrupIndex];
                        syrupCounter++;
                    });
                }
                
                if (stats.extraCount && Object.keys(stats.extraCount).length > 0 && coffeeList.length > 0) {
                    const extraTypes = Object.keys(stats.extraCount);
                    const extraCounts = extraTypes.map(type => stats.extraCount[type]);
                    
                    let extraIndex = 0;
                    let extraCounter = 0;
                    coffeeList.forEach((item, index) => {
                        if (extraCounter >= extraCounts[extraIndex]) {
                            extraCounter = 0;
                            extraIndex = (extraIndex + 1) % extraTypes.length;
                        }
                        item.extra = extraTypes[extraIndex];
                        extraCounter++;
                    });
                }
                
                console.log(`✅ Lista reconstruída para ${date}: ${coffeeList.length} cafés criados`);
                if (coffeeList.length > 0) {
                    console.log(`   Exemplo do primeiro café:`, coffeeList[0]);
                }
                
                isReconstructed = true;
                reconstructedCount++;
                reconstructedDates.push(date);
                console.log(`🔧 Data ${date}: Lista reconstruída a partir de estatísticas (${coffeeList.length} cafés aproximados)`);
                
                // Verificação crítica: se a lista está vazia, há um problema
                if (coffeeList.length === 0) {
                    console.error(`❌ ERRO: Lista reconstruída está VAZIA para ${date}!`);
                    console.error(`   Stats recebidos:`, JSON.stringify(stats, null, 2));
                }
            } else {
                // Formato desconhecido - tenta criar lista vazia para pelo menos aparecer no dropdown
                console.warn(`⚠️ Data ${date}: Formato desconhecido. Criando entrada vazia no localStorage.`);
                coffeeList = [];
                // Mesmo vazia, salva para aparecer no dropdown
                const localStorageKey = `coffeeList_${date}`;
                if (!localStorage.getItem(localStorageKey)) {
                    localStorage.setItem(localStorageKey, JSON.stringify(coffeeList));
                    downloadedCount++;
                    downloadedDates.push(date);
                }
                return; // Pula o resto do processamento para esta data
            }
            
            // Salva no localStorage com a chave coffeeList_${date}
            const localStorageKey = `coffeeList_${date}`;
            const existingListString = localStorage.getItem(localStorageKey);
            
            // Verificação crítica antes de salvar
            if (!coffeeList || !Array.isArray(coffeeList)) {
                console.error(`❌ Data ${date}: coffeeList inválido antes de salvar!`, coffeeList);
                coffeeList = [];
            }
            
            console.log(`💾 Preparando para salvar ${date}: ${coffeeList.length} cafés`);
            
            if (!existingListString) {
                // Não existe no localStorage - adiciona diretamente
                // Garante que coffeeList é um array válido
                if (coffeeList.length === 0) {
                    console.warn(`⚠️ Data ${date}: Tentando salvar lista VAZIA! Verifique os logs acima.`);
                }
                
                // Valida que cada item tem a estrutura correta
                coffeeList = coffeeList.map(item => {
                    if (!item.coffee || item.coffee === 'No Coffee Selected') {
                        console.warn(`⚠️ Item inválido encontrado e removido:`, item);
                        return null;
                    }
                    return {
                        coffee: item.coffee || 'Unknown',
                        milk: item.milk || 'Regular Milk',
                        syrup: item.syrup || 'No Syrup',
                        extra: item.extra || 'No Extra',
                        time: item.time || new Date().toLocaleTimeString(),
                        backgroundColor: item.backgroundColor || 'rgba(255, 202, 111, 0.26)'
                    };
                }).filter(item => item !== null); // Remove itens nulos
                
                // Salva no localStorage
                localStorage.setItem(localStorageKey, JSON.stringify(coffeeList));
                
                // Verifica se foi salvo corretamente
                const verify = localStorage.getItem(localStorageKey);
                if (verify) {
                    const parsed = JSON.parse(verify);
                    console.log(`✅ Data ${date}: Verificação - ${parsed.length} cafés salvos no localStorage`);
                } else {
                    console.error(`❌ Data ${date}: Falha ao salvar no localStorage!`);
                }
                
                if (isReconstructed) {
                    // Se foi reconstruída, conta separadamente
                    reconstructedCount++;
                    reconstructedDates.push(date);
                    console.log(`💾 Data ${date}: Salva no localStorage (${coffeeList.length} cafés reconstruídos)`);
                } else {
                    downloadedCount++;
                    downloadedDates.push(date);
                    console.log(`💾 Data ${date}: Salva no localStorage (${coffeeList.length} cafés)`);
                }
            } else {
                // Existe - faz merge inteligente (adiciona novos itens sem duplicar)
                try {
                    const existingList = JSON.parse(existingListString);
                    
                    // Cria um Set com IDs únicos dos itens existentes
                    const existingIds = new Set(existingList.map(item => {
                        // Cria um ID único baseado no conteúdo do café
                        return `${item.coffee}-${item.milk}-${item.syrup}-${item.extra}-${item.time}`;
                    }));
                    
                    // Filtra apenas itens novos (que não existem no localStorage)
                    const newItems = coffeeList.filter(item => {
                        const id = `${item.coffee}-${item.milk}-${item.syrup}-${item.extra}-${item.time}`;
                        return !existingIds.has(id);
                    });
                    
                    if (newItems.length > 0) {
                        // Faz merge: mantém existentes + adiciona novos
                        const mergedList = [...existingList, ...newItems];
                        localStorage.setItem(localStorageKey, JSON.stringify(mergedList));
                        updatedCount++;
                        updatedDates.push(date);
                        console.log(`🔄 Data ${date}: Atualizada no localStorage (${newItems.length} novos cafés adicionados, total: ${mergedList.length})`);
                    } else {
                        console.log(`ℹ️ Data ${date}: Já está atualizada no localStorage (nenhum item novo)`);
                    }
                } catch (error) {
                    // Se der erro no parse do localStorage existente, sobrescreve com dados do Firebase
                    console.warn(`⚠️ Data ${date}: Erro ao fazer merge, sobrescrevendo com dados do Firebase`);
                    localStorage.setItem(localStorageKey, JSON.stringify(coffeeList));
                    updatedCount++;
                    updatedDates.push(date);
                }
            }
        });

        const totalProcessed = downloadedCount + updatedCount + reconstructedCount;
        console.log(`✅ Download concluído! ${downloadedCount} nova(s), ${updatedCount} atualizada(s), ${reconstructedCount} reconstruída(s)`);

        let message = `✅ Download concluído! ${downloadedCount} data(s) nova(s) salva(s)`;
        if (updatedCount > 0) {
            message += `, ${updatedCount} data(s) atualizada(s)`;
        }
        if (reconstructedCount > 0) {
            message += `, ${reconstructedCount} data(s) reconstruída(s) a partir de estatísticas`;
        }

        return { 
            success: true, 
            message: message + '.',
            data: firebaseData,
            downloaded: downloadedCount,
            updated: updatedCount,
            reconstructed: reconstructedCount,
            downloadedDates: downloadedDates,
            updatedDates: updatedDates,
            reconstructedDates: reconstructedDates,
            totalDates: Object.keys(firebaseData).length
        };
    } catch (error) {
        console.error("❌ Erro ao fazer download do Firestore:", error);
        return { success: false, message: `❌ Erro no download: ${error.message}` };
    }
}

// Função antiga mantida para compatibilidade (agora usa upload seletivo)
export function exportData() {
    // Esta função agora é apenas para export CSV local
    // O upload para Firebase deve usar uploadSelectedDays
    console.log("exportData() is deprecated for Firebase. Use uploadSelectedDays() instead.");
}

// Upload automático agendado (usa apenas dia de hoje)
async function scheduleAutoUpload() {
    const now = new Date();
    const startHour = 7;
    const endHour = 17;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
  
    let nextRunTime;
  
    if (currentHour < startHour || (currentHour === startHour && currentMinute < 15)) {
        // If before start time or before 7:15, schedule for 7:15
        nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 15, 0, 0);
    } else if (currentHour >= endHour && currentMinute >= 15) {
        // If after last scheduled time (17:15), schedule for next day's 7:15
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        nextRunTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), startHour, 15, 0, 0);
    } else {
        // Schedule for the next hour's 15th minute
        nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 15, 0, 0);
    }
  
    const delay = nextRunTime - now;
  
    setTimeout(async () => {
        const today = getFormattedDate(new Date());
        const result = await uploadSelectedDays(today);
        console.log("Auto upload result:", result);
        scheduleAutoUpload(); // Re-run function for next scheduled time
    }, delay);
  
    console.log("Next auto upload scheduled for:", nextRunTime);
  }

// Start the scheduling
scheduleAutoUpload();

// =====================================================================
// Global Functions for HTML Access
// =====================================================================

// Função global para upload manual (chamada do HTML)
window.uploadToFirebase = async function() {
    const button = document.getElementById('uploadFirebaseBtn');
    const originalText = button ? button.textContent : '';
    
    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Fazendo upload...';
        }
        
        // Obtém a data selecionada do dropdown ou usa hoje
        const dateDropdown = document.getElementById('dateDropdown');
        const selectedDate = dateDropdown ? dateDropdown.value : getFormattedDate(new Date());
        
        const result = await uploadSelectedDays(selectedDate);
        
        if (result.success) {
            alert(result.message);
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Error uploading to Firebase:', error);
        alert('Erro ao fazer upload: ' + error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Upload para Firebase';
        }
    }
};

// Função global para download manual (chamada do HTML)
window.downloadFromFirebase = async function() {
    const button = document.getElementById('downloadFirebaseBtn');
    const originalText = button ? button.textContent : '';
    
    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Fazendo download...';
        }
        
        // Chama a função exportada de download
        const result = await downloadFirebaseData();
        
        if (result.success) {
            // IMPORTANTE: Atualiza a interface após salvar no localStorage
            // As funções do app.js precisam estar disponíveis globalmente
            const dateDropdown = document.getElementById('dateDropdown');
            const selectedDate = dateDropdown ? dateDropdown.value : getFormattedDate(new Date());
            
            // Tenta atualizar a interface usando funções do app.js
            console.log(`🔄 Iniciando atualização da interface para data: ${selectedDate}`);
            
            // Primeiro, atualiza o dropdown para incluir novas datas
            if (typeof window.updateDateDropdown === 'function') {
                window.updateDateDropdown();
                console.log('✅ Dropdown atualizado');
            }
            
            // Verifica o que está no localStorage antes de carregar
            const localStorageKey = `coffeeList_${selectedDate}`;
            const storedData = localStorage.getItem(localStorageKey);
            if (storedData) {
                try {
                    const parsed = JSON.parse(storedData);
                    console.log(`📦 Dados no localStorage para ${selectedDate}: ${parsed.length} cafés`);
                } catch (e) {
                    console.error(`❌ Erro ao parsear dados do localStorage:`, e);
                }
            } else {
                console.warn(`⚠️ Nenhum dado encontrado no localStorage para ${selectedDate}`);
            }
            
            // Recarrega a lista de cafés para a data selecionada
            if (typeof window.loadCoffeeList === 'function') {
                window.loadCoffeeList(selectedDate);
                console.log(`✅ loadCoffeeList chamado para data: ${selectedDate}`);
                
                // Pequeno delay para garantir que a variável foi atualizada
                setTimeout(() => {
                    // Atualiza a exibição da lista
                    if (typeof window.updateCoffeeList === 'function') {
                        window.updateCoffeeList();
                        console.log('✅ updateCoffeeList chamado');
                    }
                }, 100);
            } else if (typeof loadCoffeeList === 'function') {
                // Fallback: tenta sem window
                if (typeof updateDateDropdown === 'function') {
                    updateDateDropdown();
                }
                loadCoffeeList(selectedDate);
                if (typeof updateCoffeeList === 'function') {
                    updateCoffeeList();
                }
            } else {
                // Se as funções não estiverem disponíveis, força reload da página
                console.warn('Funções do app.js não disponíveis, recarregando página...');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
            
            // Mostra mensagem detalhada
            let detailMessage = result.message;
            if (result.downloadedDates && result.downloadedDates.length > 0) {
                detailMessage += `\n\n📥 Novas datas: ${result.downloadedDates.join(', ')}`;
            }
            if (result.updatedDates && result.updatedDates.length > 0) {
                detailMessage += `\n\n🔄 Datas atualizadas: ${result.updatedDates.join(', ')}`;
            }
            if (result.reconstructedDates && result.reconstructedDates.length > 0) {
                detailMessage += `\n\n🔧 Datas reconstruídas (estrutura antiga): ${result.reconstructedDates.length} data(s)`;
                if (result.reconstructedDates.length <= 10) {
                    detailMessage += `\n${result.reconstructedDates.join(', ')}`;
                }
            }
            
            alert(detailMessage);
        } else {
            alert('❌ Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Error downloading from Firebase:', error);
        alert('Erro ao fazer download: ' + error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Download do Firebase';
        }
    }
};