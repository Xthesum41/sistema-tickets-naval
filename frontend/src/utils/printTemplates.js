// Utilitários para templates de impressão

// Função para formato de data de Manaus
const formatManausDate = (date) => {
  if (!date) return '---';
  const dateObj = new Date(date);
  // Ajustar para GMT-4 (Manaus)
  const manausOffset = -4 * 60; // -4 horas em minutos
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const manausTime = new Date(utc + (manausOffset * 60000));
  return manausTime.toLocaleDateString('pt-BR');
};

// Função para formato de data e hora de Manaus
const formatManausDateTime = (date) => {
  if (!date) return '---';
  const dateObj = new Date(date);
  // Ajustar para GMT-4 (Manaus)
  const manausOffset = -4 * 60; // -4 horas em minutos
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const manausTime = new Date(utc + (manausOffset * 60000));
  return manausTime.toLocaleDateString('pt-BR') + ' ' + manausTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const generateTicketPrintContent = (ticketData) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante de Bilhete #${ticketData.ticketNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            padding: 3px;
            max-width: 80mm;
            margin: 0 auto;
          }
          
          .receipt {
            width: 100%;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 2px;
          }
          
          .receipt-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 4px;
          }
          
          .info-line {
            margin-bottom: 2px;
            font-size: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .info-line span:first-child {
            font-weight: bold;
            display: inline-block;
            min-width: 80px;
          }
          
          .section-title {
            font-weight: bold;
            margin: 6px 0 4px 0;
            text-transform: uppercase;
            font-size: 10px;
          }
          
          .customer-info {
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px dashed #000;
          }
          
          .customer-info > div {
            font-size: 10px;
            margin-bottom: 1px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .travel-info {
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px dashed #000;
          }
          
          .travel-info .info-line {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .payment-info {
            margin-bottom: 8px;
            padding-bottom: 4px;
          }
          
          .payment-info .total-line {
            font-size: 10px;
          }
          
          .totals {
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px dashed #000;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            font-size: 10px;
          }
          
          .final-total {
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 4px;
            padding-top: 2px;
            font-size: 11px;
          }
          
          .signature {
            margin-top: 12px;
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 8px;
            font-size: 10px;
          }
          
          .signature-line {
            margin-top: 15px;
            border-bottom: 1px solid #000;
            width: 70%;
            margin-left: auto;
            margin-right: auto;
          }
          
          .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 9px;
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            
            .no-print {
              display: none;
            }
          }
          
          @page {
            margin: 0;
            size: 80mm auto;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Cabeçalho -->
          <div class="header">
            <div class="company-name">TRANSPORTE FLUVIAL</div>
            <div class="receipt-title">COMPROVANTE DE BILHETE</div>
            ${ticketData.status === 'cancelado' ? `
            <div style="background: #fee; border: 1px solid #f00; padding: 5px; margin: 5px 0; text-align: center; font-weight: bold;">
              ❌ BILHETE CANCELADO
            </div>` : ''}
            <div class="info-line">
              <span>Nº do Bilhete: ${ticketData.ticketNumber || '---'}</span>
            </div>
            <div class="info-line">
              <span>Data: ${formatManausDate(ticketData.issueDate || ticketData.createdAt)}</span>
            </div>
            ${ticketData.status === 'cancelado' && ticketData.canceledAt ? `
            <div class="info-line">
              <span>Cancelado em: ${formatManausDate(ticketData.canceledAt)}</span>
            </div>` : ''}
          </div>

          <!-- Dados do Passageiro -->
          <div class="customer-info">
            <div class="section-title">PASSAGEIRO:</div>
            <div>Nome: ${ticketData.passengerName || '---'}</div>
            <div>CPF: ${ticketData.cpf || '---'}</div>
            <div>RG: ${ticketData.rg || '---'}</div>
            <div>Telefone: ${ticketData.phone || '---'}</div>
            <div>Endereço: ${ticketData.address || '---'}</div>
          </div>

          <!-- Dados da Viagem -->
          <div class="travel-info">
            <div class="section-title">DADOS DA VIAGEM:</div>
            <div class="info-line">
              <span>Rota:</span>
              <span>${ticketData.route || '---'}</span>
            </div>
            <div class="info-line">
              <span>Partida:</span>
              <span>${formatManausDateTime(ticketData.departureDateTime)}</span>
            </div>
            <div class="info-line">
              <span>Acomodação:</span>
              <span>${ticketData.accommodationType || '---'}</span>
            </div>
            ${(ticketData.accommodationType === 'suíte' || ticketData.accommodationType === 'camarote') && ticketData.suiteNumber ? `
            <div class="info-line">
              <span>${ticketData.accommodationType === 'suíte' ? 'Suíte Nº:' : 'Camarote Nº:'}</span>
              <span>${ticketData.suiteNumber}</span>
            </div>` : ''}
            <div class="info-line">
              <span>Bagagens:</span>
              <span>${ticketData.luggageQuantity || 0}</span>
            </div>
            ${ticketData.vesselName ? `
            <div class="info-line">
              <span>Embarcação:</span>
              <span>${ticketData.vesselName}</span>
            </div>` : ''}
          </div>

          <!-- Totais -->
          <div class="totals">
            ${ticketData.discount && ticketData.discount > 0 ? `
            <div class="total-line">
              <span>DESCONTO:</span>
              <span>R$ ${parseFloat(ticketData.discount || 0).toFixed(2)}</span>
            </div>` : ''}
            <div class="total-line final-total">
              <span>VALOR TOTAL:</span>
              <span><strong>R$ ${parseFloat(ticketData.total || 0).toFixed(2)}</strong></span>
            </div>
          </div>

          <!-- Informações de Pagamento -->
          ${ticketData.paymentStatus === 'pago' ? `
          <div class="payment-info">
            <div class="section-title">PAGAMENTO:</div>
            <div class="total-line">
              <span>STATUS:</span>
              <span><strong>PAGO</strong></span>
            </div>
            <div class="total-line">
              <span>FORMA:</span>
              <span><strong>${ticketData.paymentMethod === 'pix' ? 'PIX' : 
                     ticketData.paymentMethod === 'dinheiro' ? 'DINHEIRO' : 
                     ticketData.paymentMethod === 'cartao' ? 'CARTÃO' : '---'}</strong></span>
            </div>
            ${ticketData.paymentDate ? `
            <div class="total-line">
              <span>DATA:</span>
              <span><strong>${formatManausDate(ticketData.paymentDate)}</strong></span>
            </div>` : ''}
          </div>
          ` : `
          <div class="payment-info">
            <div class="section-title">PAGAMENTO:</div>
            <div class="total-line">
              <span>STATUS:</span>
              <span><strong>⏳ PENDENTE</strong></span>
            </div>
          </div>
          `}

          <!-- Assinatura -->
          <div class="signature">
            <div>Assinatura:</div>
            <div class="signature-line"></div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Sistema de Gestão de Passagens</div>
            <div>${formatManausDateTime(new Date())}</div>
          </div>

          <!-- Botão de Impressão (apenas na tela) -->
          <div class="no-print" style="text-align: center; margin-top: 20px; padding: 10px; background: #f0f0f0; border: 1px dashed #999;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #000; color: #fff; border: none; cursor: pointer;">
              🖨️ IMPRIMIR COMPROVANTE
            </button>
            <div style="margin-top: 5px; font-size: 10px; color: #666;">
              Otimizado para impressoras térmicas 58mm/80mm
            </div>
          </div>
        </div>

        <script>
          // Auto-print após 1 segundo se não houver interação
          setTimeout(function() {
            if (!document.hasFocus || !document.hasFocus()) {
              window.print();
            }
          }, 1000);
        </script>
      </body>
    </html>
  `;
};

export const generateFreightNotePrintContent = (noteData) => {
  // Calcular totais
  const totalWeight = noteData.goods?.reduce((sum, good) => sum + (parseFloat(good.weight) || 0), 0) || 0;
  const totalDiscount = noteData.goods?.reduce((sum, good) => sum + (parseFloat(good.discount) || 0), 0) || 0;
  const totalValue = noteData.goods?.reduce((sum, good) => sum + (parseFloat(good.value) || 0), 0) || 0;
  const finalValue = totalValue - totalDiscount;
  const totalItems = noteData.goods?.reduce((sum, good) => sum + (parseInt(good.quantity) || 0), 0) || 0;

  // Função para truncar texto
  const truncate = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante de Nota de Frete #${noteData.noteNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: #fff;
            padding: 5px;
            max-width: 80mm;
            margin: 0 auto;
          }
          
          .receipt {
            width: 100%;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 2px;
          }
          
          .receipt-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
          }
          
          .separator {
            text-align: center;
            margin: 5px 0;
            font-weight: bold;
          }
          
          .info-line {
            margin-bottom: 3px;
            display: flex;
            justify-content: space-between;
          }
          
          .section-title {
            font-weight: bold;
            margin: 8px 0 5px 0;
            text-transform: uppercase;
          }
          
          .customer-info {
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #000;
          }
          
          .goods-header {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding: 2px 0;
            margin-bottom: 3px;
          }
          
          .goods-item {
            margin-bottom: 2px;
            font-size: 11px;
          }
          
          .goods-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .item-details {
            flex: 1;
            margin-right: 5px;
          }
          
          .item-price {
            white-space: nowrap;
          }
          
          .totals {
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px dashed #000;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          
          .final-total {
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 5px;
            padding-top: 3px;
          }
          
          .signature {
            margin-top: 15px;
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          
          .signature-line {
            margin-top: 20px;
            border-bottom: 1px solid #000;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
          }
          
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            
            .no-print {
              display: none;
            }
          }
          
          @page {
            margin: 0;
            size: 80mm auto;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Cabeçalho -->
          <div class="header">
            <div class="company-name">TRANSPORTE & FRETE</div>
            <div class="receipt-title">COMPROVANTE DE NOTA DE FRETE</div>
            ${noteData.status === 'cancelado' ? `
            <div style="background: #fee; border: 1px solid #f00; padding: 5px; margin: 5px 0; text-align: center; font-weight: bold;">
              ❌ NOTA CANCELADA
            </div>` : ''}
            <div class="info-line">
              <span>Nº da Nota: ${noteData.noteNumber || '---'}</span>
            </div>
            <div class="info-line">
              <span>Data: ${formatManausDate(noteData.issueDate || noteData.createdAt)}</span>
            </div>
            ${noteData.status === 'cancelado' && noteData.canceledAt ? `
            <div class="info-line">
              <span>Cancelada em: ${formatManausDate(noteData.canceledAt)}</span>
            </div>` : ''}
          </div>

          <!-- Dados do Destinatário -->
          <div class="customer-info">
            <div class="section-title">DESTINATÁRIO:</div>
            <div>Nome: ${truncate(noteData.recipient || '---', 28)}</div>
            <div>Endereço: ${truncate(noteData.address || '---', 25)}</div>
            <div>Cidade: ${truncate(noteData.city || '---', 27)}</div>
            <div>Telefone: ${noteData.phone || '---'}</div>
            <div>CPF/CNPJ: ${noteData.idNumber || '---'}</div>
          </div>

          <!-- Mercadorias -->
          <div class="goods-section">
            <div class="section-title">MERCADORIAS:</div>
            <div class="goods-header">
              QTD | Descrição             | NF   | Valor
              ----+------------------------+------+---------
            </div>
            ${noteData.goods?.map(good => `
              <div class="goods-item">
                <div class="goods-line">
                  <span style="width: 3ch; display: inline-block;">${String(good.quantity || 0).padStart(2, ' ')}</span>
                  <span style="width: 1ch; display: inline-block;">|</span>
                  <span style="width: 22ch; display: inline-block;">${truncate(good.description || '---', 20).padEnd(20, ' ')}</span>
                  <span style="width: 1ch; display: inline-block;">|</span>
                  <span style="width: 4ch; display: inline-block;">${String(good.invoiceNumber || '---').substring(0, 4).padEnd(4, ' ')}</span>
                  <span style="width: 1ch; display: inline-block;">|</span>
                  <span style="width: 9ch; display: inline-block; text-align: right;">R$ ${parseFloat(good.value || 0).toFixed(2).padStart(6, ' ')}</span>
                </div>
              </div>
            `).join('') || '<div class="goods-item">Nenhuma mercadoria cadastrada</div>'}
          </div>

          <!-- Totais -->
          <div class="totals">
            <div class="total-line">
              <span>TOTAL DE ITENS:</span>
              <span>${totalItems}</span>
            </div>
            <div class="total-line">
              <span>PESO TOTAL:</span>
              <span>${totalWeight.toFixed(2)}kg</span>
            </div>
            <div class="total-line">
              <span>DESCONTO:</span>
              <span>R$ ${totalDiscount.toFixed(2)}</span>
            </div>
            <div class="total-line final-total">
              <span>VALOR FINAL:</span>
              <span><strong>R$ ${finalValue.toFixed(2)}</strong></span>
            </div>
          </div>

          <!-- Informações de Pagamento -->
          ${noteData.paymentStatus === 'pago' ? `
          <div class="payment-info">
            <div class="section-title">PAGAMENTO:</div>
            <div class="total-line">
              <span>STATUS:</span>
              <span><strong>PAGO</strong></span>
            </div>
            <div class="total-line">
              <span>FORMA:</span>
              <span><strong>${noteData.paymentMethod === 'pix' ? 'PIX' : 
                     noteData.paymentMethod === 'dinheiro' ? 'DINHEIRO' : 
                     noteData.paymentMethod === 'cartao' ? 'CARTÃO' : '---'}</strong></span>
            </div>
            ${noteData.paymentDate ? `
            <div class="total-line">
              <span>DATA:</span>
              <span><strong>${formatManausDate(noteData.paymentDate)}</strong></span>
            </div>` : ''}
          </div>
          ` : `
          <div class="payment-info">
            <div class="section-title">PAGAMENTO:</div>
            <div class="total-line">
              <span>STATUS:</span>
              <span><strong>⏳ PENDENTE</strong></span>
            </div>
          </div>
          `}

          <!-- Assinatura -->
          <div class="signature">
            <div>Assinatura:</div>
            <div class="signature-line"></div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Sistema de Gestão de Frete</div>
            <div>${formatManausDateTime(new Date())}</div>
          </div>

          <!-- Botão de Impressão (apenas na tela) -->
          <div class="no-print" style="text-align: center; margin-top: 20px; padding: 10px; background: #f0f0f0; border: 1px dashed #999;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #000; color: #fff; border: none; cursor: pointer;">
              🖨️ IMPRIMIR COMPROVANTE
            </button>
            <div style="margin-top: 5px; font-size: 10px; color: #666;">
              Otimizado para impressoras térmicas 58mm/80mm
            </div>
          </div>
        </div>

        <script>
          // Auto-print após 1 segundo se não houver interação
          setTimeout(function() {
            if (!document.hasFocus || !document.hasFocus()) {
              window.print();
            }
          }, 1000);
        </script>
      </body>
    </html>
  `;
};
