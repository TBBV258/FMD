// Profile Page Functionality: Payments and Data Download
document.addEventListener('DOMContentLoaded', () => {
    // --- Payment Modal and Simulation Logic ---
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalBody = document.getElementById('payment-modal-body');
    const closePaymentModalBtn = document.getElementById('close-payment-modal');

    const closePaymentModal = () => {
        paymentModal.style.display = 'none';
        paymentModalBody.innerHTML = ''; // Clear content
    };

    if (closePaymentModalBtn) {
        closePaymentModalBtn.addEventListener('click', closePaymentModal);
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) closePaymentModal();
        });
    }

    async function simulatePayment(method, plan, price) {
        paymentModal.style.display = 'flex';

        // Step 1: Initial instructions
        const methodName = method.toUpperCase();
        const iconClass = method === 'mpesa' ? 'mpesa' : 'emola';
        paymentModalBody.innerHTML = `
            <div class="payment-step">
                <i class="fas fa-mobile-alt icon ${iconClass}"></i>
                <h4>Confirme o pagamento de ${price}</h4>
                <p>Por favor, introduza o seu PIN no seu telemóvel para aprovar o pagamento via ${methodName}.</p>
            </div>`;

        // Step 2: Simulate processing
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait 4 seconds

        paymentModalBody.innerHTML = `
            <div class="payment-step">
                <i class="fas fa-spinner fa-spin icon processing"></i>
                <h4>A processar...</h4>
                <p>Aguarde enquanto confirmamos o seu pagamento. Não feche esta janela.</p>
            </div>`;

        // Step 3: Simulate success and update database
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) throw new Error('Utilizador não autenticado.');

            if (!window.profilesApi) throw new Error('API de perfis não inicializada.');
            await window.profilesApi.update(user.id, { plan: 'premium' });

            // Step 4: Show success message
            paymentModalBody.innerHTML = `
                <div class="payment-step">
                    <i class="fas fa-check-circle icon success"></i>
                    <h4>Pagamento Concluído!</h4>
                    <p>O seu plano foi atualizado para Premium. Bem-vindo!</p>
                </div>`;
            
            // Update UI in real-time
            const planBadge = document.getElementById('profile-plan');
            if (planBadge) {
                planBadge.textContent = 'premium';
                planBadge.className = 'plan-badge premium'; // You might need to add a .premium class in your CSS
            }
            if (window.showToast) window.showToast('Plano atualizado para Premium!', 'success');

        } catch (error) {
            console.error('Falha ao atualizar o plano:', error);
            if (window.showToast) window.showToast(`Erro: ${error.message}`, 'error');
            closePaymentModal();
            return;
        }

        // Step 5: Close modal automatically
        await new Promise(resolve => setTimeout(resolve, 3000));
        closePaymentModal();
    }

    const paymentButtons = document.querySelectorAll('.payment-btn');
    paymentButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const method = e.currentTarget.dataset.method;
            const planCard = e.currentTarget.closest('.plan-card');
            const plan = planCard.querySelector('h4').textContent;
            const price = planCard.querySelector('.price').textContent.split('/')[0];
            
            simulatePayment(method, plan, price);
        });
    });

    // --- Download All Documents Logic ---
    const downloadBtn = document.getElementById('download-all-docs');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const spinner = document.getElementById('download-spinner');
            const btnText = downloadBtn.querySelector('.fa-download').nextSibling;

            // --- Helper function to fetch a file as a blob ---
            async function fetchFile(url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for url: ${url}`);
                    }
                    return response.blob();
                } catch (error) {
                    console.error('Failed to fetch file:', error);
                    return null; // Return null for failed downloads
                }
            }

            try {
                // 1. Get user and show loading state
                const { data: { user } } = await window.supabase.auth.getUser();
                if (!user) {
                    if (window.showToast) window.showToast('Por favor, faça login para baixar seus documentos.', 'error');
                    return;
                }

                downloadBtn.disabled = true;
                spinner.style.display = 'inline-block';
                btnText.textContent = ' Preparando...';

                // 2. Fetch user's documents from Supabase
                if (!window.documentsApi) {
                    throw new Error('API de documentos não inicializada.');
                }
                const documents = await window.documentsApi.getByUser(user.id);

                if (!documents || documents.length === 0) {
                    if (window.showToast) window.showToast('Você não tem nenhum documento para baixar.', 'info');
                    return;
                }

                // 3. Initialize JSZip and fetch all files
                const zip = new JSZip();
                btnText.textContent = ' Baixando arquivos...';

                const filePromises = documents.map(doc => fetchFile(doc.file_url));
                const fileBlobs = await Promise.all(filePromises);

                // 4. Add files to the zip
                documents.forEach((doc, index) => {
                    const blob = fileBlobs[index];
                    if (blob) { // Only add if the fetch was successful
                        zip.file(doc.file_name || `${doc.id}.tmp`, blob);
                    }
                });

                // 5. Generate and trigger download
                btnText.textContent = ' Compactando...';
                const zipBlob = await zip.generateAsync({ type: 'blob' });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `FindMyDocs_Backup_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href); // Clean up

                if (window.showToast) window.showToast('Download iniciado com sucesso!', 'success');

            } catch (error) {
                console.error('Failed to download documents:', error);
                if (window.showToast) window.showToast(`Erro ao baixar documentos: ${error.message}`, 'error');
            } finally {
                // 6. Reset button state
                downloadBtn.disabled = false;
                spinner.style.display = 'none';
                btnText.textContent = ' Baixar Meus Documentos';
            }
        });
    }
});
