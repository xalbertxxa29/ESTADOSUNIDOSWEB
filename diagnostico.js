// Diagnostic Script - Run this in the browser console to check your Firestore data
console.log('%c═══════════════════════════════════════', 'color: #6366f1; font-weight: bold; font-size: 14px;');
console.log('%cDIAGNÓSTICO DE FIRESTORE', 'color: #6366f1; font-weight: bold; font-size: 14px;');
console.log('%c═══════════════════════════════════════', 'color: #6366f1; font-weight: bold; font-size: 14px;');

// Function to diagnose Firestore data
async function diagnosticoFirestore() {
    if (!window.db) {
        console.error('❌ Firestore no está inicializado');
        return;
    }

    try {
        const snapshot = await window.db.collection('IncidenciasEU').limit(5).get();
        
        console.log(`\n📊 Total de documentos en la colección: ${snapshot.size}`);
        console.log('\n📋 Primeros 5 documentos:\n');

        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n${'─'.repeat(80)}`);
            console.log(`%cDocumento ${index + 1}:`, 'color: #10b981; font-weight: bold; font-size: 12px;');
            console.log(`ID: ${doc.id}`);
            console.log('\nContenido completo:');
            console.log(data);

            // Check for coordinate fields
            console.log('%c\n✅ ANÁLISIS DE COORDENADAS:', 'color: #f59e0b; font-weight: bold;');
            
            if (data.ubicacion) {
                console.log('📍 Campo "ubicacion":', data.ubicacion);
            } else {
                console.log('❌ NO TIENE campo "ubicacion"');
            }

            if (data.coordenadas) {
                console.log('📍 Campo "coordenadas":', data.coordenadas);
            }

            if (data.position) {
                console.log('📍 Campo "position":', data.position);
            }

            if (data.lat && data.lng) {
                console.log('📍 Campos directo "lat/lng":', { lat: data.lat, lng: data.lng });
            }

            console.log('\n🔍 Tipos de datos en el documento:');
            Object.keys(data).forEach(key => {
                const value = data[key];
                console.log(`   ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 50)}`);
            });
        });

        console.log('\n' + '═'.repeat(80));
        console.log('\n✅ RECOMENDACIONES:');
        console.log('1. Si "ubicacion" existe pero está vacío → agrégale: { lat: número, lng: número }');
        console.log('2. Si "lat" y "lng" son strings ("25.77") → debes guardarlos como números (25.77)');
        console.log('3. Asegúrate que lat esté entre -90 y 90, lng entre -180 y 180');
        
    } catch (error) {
        console.error('❌ Error al diagnosticar:', error);
    }
}

// Run the diagnostic
diagnosticoFirestore();
