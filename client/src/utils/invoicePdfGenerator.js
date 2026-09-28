import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(Number(amount) || 0);
};

export const getMonthName = (monthIndex) => {
    return MONTH_NAMES[monthIndex] || '';
};

/**
 * Motor unificado de generación de PDF para Esencialmente Psicología.
 * Utilizado de forma idéntica por el portal del terapeuta y el dashboard de administración.
 * 
 * Regla de Oro:
 * - Facturas Nuevas con Snapshot: Utilizan el snapshot inmutable como fuente de verdad.
 * - Facturas Nuevas sin Snapshot (Pre-factura): Utilizan datos interactivos respetando el vatTreatment seleccionado.
 * - Facturas Históricas (vat_treatment = NULL, invoice_snapshot = NULL): Modo fallback legacy read-only.
 */
export const generateInvoicePDF = ({
    snapshot = null,
    invoice = null,
    therapistData = null,
    centerData = null,
    sessions = [],
    month = 0,
    year = new Date().getFullYear(),
    invoiceNumber = '',
    therapistPercentage = 60,
    irpf = 15,
    vatTreatment = null, // 'EXEMPT' | 'STANDARD' | null
    submissionDate = null,
    saveAsFile = true
}) => {
    const doc = new jsPDF();

    // 1. Detectar si disponemos de snapshot inmutable (Facturas Nuevas emitidas)
    const hasSnapshot = Boolean(snapshot && snapshot.version === 1);

    // 2. Extraer datos del emisor (Terapeuta) y receptor (Clínica)
    let finalTherapist = {};
    let finalCenter = {};
    let activeSessions = [];
    let finalInvoiceNumber = '';
    let finalMonth = month;
    let finalYear = year;
    let finalSubmissionDate = submissionDate;

    // Variables financieras
    let finalSubtotal = 0;
    let finalCenterPercentage = 0;
    let finalCenterAmount = 0;
    let finalBaseDisponible = 0;
    let finalIrpfPercentage = 0;
    let finalIrpfAmount = 0;
    let isExempt = false;
    let finalIvaPercentage = 0;
    let finalIvaAmount = 0;
    let finalTotalFactura = 0;
    let exemptionReasonText = '';
    let isLegacy = false;

    if (hasSnapshot) {
        // --- MODO NUEVO: SNAPSHOT DOCUMENTAL INMUTABLE ---
        const s = snapshot;
        finalTherapist = s.therapist || {};
        finalCenter = s.center || {};
        activeSessions = s.sessions || [];
        finalInvoiceNumber = s.invoiceNumber || '';
        finalSubmissionDate = s.issuedAt ? new Date(s.issuedAt).toLocaleDateString('es-ES') : submissionDate;

        const f = s.financial || {};
        finalSubtotal = Number(f.subtotal || 0);
        finalCenterPercentage = Number(f.centerPercentage || 0);
        finalCenterAmount = Number(f.centerAmount || 0);
        finalBaseDisponible = Number(f.baseDisponible || (finalSubtotal - finalCenterAmount));
        finalIrpfPercentage = Number(f.irpfPercentage || 0);
        finalIrpfAmount = Number(f.irpfAmount || 0);

        if (f.vatTreatment === 'EXEMPT') {
            isExempt = true;
            finalIvaPercentage = 0;
            finalIvaAmount = 0;
            exemptionReasonText = f.vatExemptionReason || 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.';
        } else {
            isExempt = false;
            finalIvaPercentage = Number(f.vatPercentage || 21);
            finalIvaAmount = Number(f.vatAmount || 0);
            exemptionReasonText = '';
        }
        finalTotalFactura = Number(f.totalAmount || 0);

    } else if (invoice && invoice.id) {
        // --- FACTURA PERSISTIDA EN DB SIN SNAPSHOT (O factura nueva donde no vino el snapshot completo) ---
        finalTherapist = therapistData || {};
        finalCenter = centerData || {};
        activeSessions = sessions || [];
        finalInvoiceNumber = invoice.invoice_number || '';
        finalMonth = invoice.month !== undefined ? invoice.month : month;
        finalYear = invoice.year !== undefined ? invoice.year : year;
        finalSubmissionDate = invoice.submitted_at 
            ? new Date(invoice.submitted_at).toLocaleDateString('es-ES') 
            : submissionDate;

        finalSubtotal = parseFloat(invoice.subtotal || 0);
        finalCenterPercentage = parseFloat(invoice.center_percentage || 0);
        finalCenterAmount = parseFloat(invoice.center_amount || 0);
        finalBaseDisponible = finalSubtotal - finalCenterAmount;
        finalIrpfPercentage = parseFloat(invoice.irpf_percentage || 0);
        finalIrpfAmount = invoice.irpf_amount !== undefined && invoice.irpf_amount !== null
            ? parseFloat(invoice.irpf_amount)
            : (finalBaseDisponible * (finalIrpfPercentage / 100));

        // Determinar si es Factura Nueva con vat_treatment explícito o Factura Histórica Legacy
        if (invoice.vat_treatment === 'EXEMPT') {
            isExempt = true;
            finalIvaPercentage = 0;
            finalIvaAmount = 0;
            exemptionReasonText = invoice.vat_exemption_reason || 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.';
        } else if (invoice.vat_treatment === 'STANDARD') {
            isExempt = false;
            finalIvaPercentage = 21;
            finalIvaAmount = parseFloat(invoice.iva_amount || (finalBaseDisponible * 0.21));
            exemptionReasonText = '';
        } else {
            // FALLBACK LEGACY ESTRICTO: vat_treatment es NULL (facturas emitidas antes del cambio)
            isLegacy = true;
            finalIvaPercentage = parseFloat(invoice.iva_percentage || 0);
            finalIvaAmount = invoice.iva_amount !== undefined && invoice.iva_amount !== null
                ? parseFloat(invoice.iva_amount)
                : (finalBaseDisponible * (finalIvaPercentage / 100));
            // En legacy, si iva era 0 se imprimía el texto legal histórico tal como existía en BillingTab
            if (finalIvaPercentage === 0) {
                exemptionReasonText = 'Operación exenta según lo dispuesto en el art. 20. Uno. 3 de la Ley 37/1992 de 28 de diciembre. del Impuesto sobre el Valor Añadido.';
            } else {
                exemptionReasonText = '';
            }
        }
        finalTotalFactura = parseFloat(invoice.total_amount || 0);

    } else {
        // --- MODO PRE-FACTURA (Interactiva antes de presentar) ---
        finalTherapist = therapistData || {};
        finalCenter = centerData || {};
        activeSessions = sessions || [];
        finalInvoiceNumber = invoiceNumber || '';
        finalMonth = month;
        finalYear = year;
        finalSubmissionDate = submissionDate || new Date().toLocaleDateString('es-ES');

        finalSubtotal = activeSessions.reduce((sum, s) => sum + (s.price || 0), 0);
        finalCenterPercentage = 100 - therapistPercentage;
        finalCenterAmount = finalSubtotal * (finalCenterPercentage / 100);
        finalBaseDisponible = finalSubtotal * (therapistPercentage / 100);
        finalIrpfPercentage = irpf;
        finalIrpfAmount = finalBaseDisponible * (finalIrpfPercentage / 100);

        if (vatTreatment === 'EXEMPT') {
            isExempt = true;
            finalIvaPercentage = 0;
            finalIvaAmount = 0;
            exemptionReasonText = 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.';
        } else if (vatTreatment === 'STANDARD') {
            isExempt = false;
            finalIvaPercentage = 21;
            finalIvaAmount = finalBaseDisponible * 0.21;
            exemptionReasonText = '';
        } else {
            // Si aún no ha seleccionado (o legacy preview)
            isExempt = false;
            finalIvaPercentage = 0;
            finalIvaAmount = 0;
            exemptionReasonText = '';
        }
        finalTotalFactura = finalBaseDisponible + finalIvaAmount - finalIrpfAmount;
    }

    // =========================================================================
    // DIBUJO DEL PDF (Apariencia y maquetación fiel al diseño actual)
    // =========================================================================

    // Cabecera naranja
    doc.setFillColor(255, 140, 66);
    doc.rect(0, 0, 210, 40, 'F');

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FACTURA', 105, 15, { align: 'center' });

    // Número de factura
    if (finalInvoiceNumber) {
        doc.setFontSize(14);
        doc.text(`Nº ${finalInvoiceNumber}`, 105, 24, { align: 'center' });
    }

    // Período y fecha de emisión
    const monthName = getMonthName(finalMonth);
    doc.setFontSize(11);
    doc.text(`Mes Facturado: ${monthName} ${finalYear}`, 105, finalInvoiceNumber ? 31 : 27, { align: 'center' });

    if (finalSubmissionDate) {
        doc.setFontSize(9);
        doc.text(`Fecha de Emisión: ${finalSubmissionDate}`, 105, finalInvoiceNumber ? 36 : 33, { align: 'center' });
    }

    // Reset de estilos de texto
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Columna izquierda - "FACTURAR A:" (Centro)
    doc.setFont(undefined, 'bold');
    doc.text('FACTURAR A:', 14, 48);
    doc.setFont(undefined, 'normal');

    let yPosLeft = 54;
    const centerName = finalCenter.name || finalCenter.legalName || 'Esencialmente Psicología';
    doc.text(centerName, 14, yPosLeft);
    yPosLeft += 5;

    if (finalCenter.legalName && finalCenter.legalName !== centerName) {
        doc.text(`(${finalCenter.legalName})`, 14, yPosLeft);
        yPosLeft += 5;
    }
    if (finalCenter.nif) {
        doc.text(finalCenter.nif, 14, yPosLeft);
        yPosLeft += 5;
    }
    const cAddress1 = finalCenter.addressLine1 || finalCenter.address_line1;
    if (cAddress1) {
        doc.text(cAddress1, 14, yPosLeft);
        yPosLeft += 5;
    }
    const cAddress2 = finalCenter.addressLine2 || finalCenter.address_line2;
    if (cAddress2) {
        doc.text(cAddress2, 14, yPosLeft);
        yPosLeft += 5;
    }
    const cPostal = finalCenter.postalCode || finalCenter.postal_code;
    const cCity = finalCenter.city;
    const centerCityPostal = [cPostal, cCity].filter(Boolean).join(' ');
    if (centerCityPostal) {
        doc.text(centerCityPostal, 14, yPosLeft);
    }

    // Columna derecha - "DE:" (Terapeuta)
    doc.setFont(undefined, 'bold');
    doc.text('DE:', 120, 48);
    doc.setFont(undefined, 'normal');

    let yPosRight = 54;
    const tFullName = finalTherapist.fullName || finalTherapist.full_name || '';
    if (tFullName) {
        doc.text(tFullName, 120, yPosRight);
        yPosRight += 5;
    }
    if (finalTherapist.nif) {
        doc.text(finalTherapist.nif, 120, yPosRight);
        yPosRight += 5;
    }
    const tAddress1 = finalTherapist.addressLine1 || finalTherapist.address_line1;
    if (tAddress1) {
        doc.text(tAddress1, 120, yPosRight);
        yPosRight += 5;
    }
    const tAddress2 = finalTherapist.addressLine2 || finalTherapist.address_line2;
    if (tAddress2) {
        doc.text(tAddress2, 120, yPosRight);
        yPosRight += 5;
    }
    const tPostal = finalTherapist.postalCode || finalTherapist.postal_code;
    const tCity = finalTherapist.city;
    const therapistCityPostal = [tPostal, tCity].filter(Boolean).join(' ');
    if (therapistCityPostal) {
        doc.text(therapistCityPostal, 120, yPosRight);
        yPosRight += 5;
    }
    if (finalTherapist.iban) {
        doc.text(finalTherapist.iban, 120, yPosRight);
    }

    // Agrupar sesiones por precio
    const sessionsByPrice = {};
    activeSessions.forEach(session => {
        const price = session.price || session.modified_price || 0;
        if (!sessionsByPrice[price]) {
            sessionsByPrice[price] = { count: 0, price: price };
        }
        sessionsByPrice[price].count++;
    });

    const tableData = Object.values(sessionsByPrice).map(group => [
        `${group.count} ${group.count === 1 ? 'sesión' : 'sesiones'}`,
        formatCurrency(group.price),
        `${group.count} x ${formatCurrency(group.price)}`,
        formatCurrency(group.count * group.price)
    ]);

    // Tabla de detalle de sesiones
    autoTable(doc, {
        startY: 86,
        head: [['Descripción', 'Precio/Unidad', 'Cantidad', 'Total']],
        body: tableData.length > 0 ? tableData : [['Sin sesiones computables', '-', '-', '0,00 €']],
        theme: 'striped',
        headStyles: {
            fillColor: [255, 140, 66],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10
        }
    });

    // Bloque de resumen económico y desglose fiscal
    let finalY = doc.lastAutoTable.finalY + 12;

    const labelX = 115;
    const valueX = 195;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('SUBTOTAL:', labelX, finalY);
    doc.text(formatCurrency(finalSubtotal), valueX, finalY, { align: 'right' });

    finalY += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`- Centro (${finalCenterPercentage}%):`, labelX, finalY);
    doc.text(formatCurrency(finalCenterAmount), valueX, finalY, { align: 'right' });

    finalY += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`BASE DISPONIBLE (${100 - finalCenterPercentage}%):`, labelX, finalY);
    doc.text(formatCurrency(finalBaseDisponible), valueX, finalY, { align: 'right' });

    finalY += 7;
    doc.setFont(undefined, 'normal');

    // Desglose de IVA según tratamiento fiscal
    if (isExempt) {
        // Factura Exenta Nueva: Mostrar explícitamente "IVA: Exento"
        doc.text('IVA:', labelX, finalY);
        doc.text('Exento', valueX, finalY, { align: 'right' });
        finalY += 7;
    } else if (finalIvaPercentage > 0) {
        // Factura Estándar o Legacy con IVA
        doc.text(`+ ${finalIvaPercentage}% IVA:`, labelX, finalY);
        doc.text(formatCurrency(finalIvaAmount), valueX, finalY, { align: 'right' });
        finalY += 7;
    } else if (isLegacy) {
        // Legacy con iva 0: No mostraba línea de IVA
    }

    doc.text(`- ${finalIrpfPercentage}% IRPF:`, labelX, finalY);
    doc.text(formatCurrency(finalIrpfAmount), valueX, finalY, { align: 'right' });

    finalY += 8;
    // Línea separadora naranja
    doc.setDrawColor(255, 140, 66);
    doc.setLineWidth(0.5);
    doc.line(labelX, finalY, valueX, finalY);
    finalY += 7;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 140, 66);
    doc.text('TOTAL FACTURA:', labelX, finalY);
    doc.text(formatCurrency(finalTotalFactura), valueX, finalY, { align: 'right' });

    // Mención legal de exención de IVA (si corresponde)
    if (exemptionReasonText) {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont(undefined, 'italic');
        const legalLines = doc.splitTextToSize(exemptionReasonText, 180);

        // Posicionamiento dinámico seguro sin desbordar el pie de página
        let legalY = Math.max(finalY + 12, 268);
        if (legalY > 275) {
            doc.addPage();
            legalY = 30;
        }
        doc.text(legalLines, 105, legalY, { align: 'center' });
    }

    // Pie de página fijo
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text('Esencialmente Psicología - www.esencialmentepsicologia.com', 105, 285, { align: 'center' });

    // Guardar archivo si se solicita
    if (saveAsFile) {
        const cleanName = (tFullName || 'Terapeuta').replace(/\s+/g, '_');
        const fileName = `Factura_${finalYear}_${monthName}_${cleanName}.pdf`;
        doc.save(fileName);
    }

    return doc;
};
