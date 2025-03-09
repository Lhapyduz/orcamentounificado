import { useState, useEffect } from 'react'
import './App.css'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

function App() {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState(1)
  const [calculatedPrice, setCalculatedPrice] = useState(null)
  const [pricePerUnit, setPricePerUnit] = useState(null)
  const [savedProducts, setSavedProducts] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme === 'dark'
  })

  useEffect(() => {
    const saved = localStorage.getItem('savedProducts')
    if (saved) {
      setSavedProducts(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : ''
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const calculatePrice = (inputPrice, qty, unitValue) => {
    if (!inputPrice || !unitValue) return { total: null, perUnit: null }
    const basePrice = parseFloat(inputPrice)
    const units = parseFloat(unitValue)
    const quantity = parseFloat(qty)
    if (isNaN(basePrice) || isNaN(units) || units <= 0 || isNaN(quantity)) return { total: null, perUnit: null }
  
    let result = basePrice
    result = result + 15
    result = result / 0.6
    result = Math.ceil(result)
    result = Math.floor(result / 10) * 10 + 9.99
    
    const perUnit = (result / units).toFixed(2)
    const total = (result * quantity).toFixed(2)
    
    return { total, perUnit }
  }

  const handleCalculate = () => {
    const result = calculatePrice(price, quantity, unit)
    setCalculatedPrice(result.total)
    setPricePerUnit(result.perUnit)
  }

  const handleSave = () => {
    if (!calculatedPrice || !name) return

    const newProduct = {
      id: Date.now(),
      name,
      quantity,
      unit,
      basePrice: price,
      finalPrice: calculatedPrice,
      pricePerUnit: (parseFloat(calculatedPrice) / parseFloat(unit)).toFixed(2)
    }

    const updatedProducts = [...savedProducts, newProduct]
    setSavedProducts(updatedProducts)
    localStorage.setItem('savedProducts', JSON.stringify(updatedProducts))

    // Reset form
    setName('')
    setPrice('')
    setQuantity(1)
    setUnit(1)
    setCalculatedPrice(null)
    setPricePerUnit(null)
}

  const handleDelete = (productId) => {
    const updatedProducts = savedProducts.filter(product => product.id !== productId)
    setSavedProducts(updatedProducts)
    localStorage.setItem('savedProducts', JSON.stringify(updatedProducts))
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Add company name and subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(26, 35, 126);
      doc.text('VIZUALIZA', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Comunicação Visual', pageWidth / 2, 40, { align: 'center' });
      
      // Add document title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', pageWidth / 2, 60, { align: 'center' });
      
      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data: ${currentDate}`, pageWidth - 20, 70, { align: 'right' });
      
      // Add table
      const tableData = savedProducts.map(product => [
        product.name,
        product.quantity,
        `R$ ${product.pricePerUnit}`,
        `R$ ${product.finalPrice}`
      ]);

      doc.autoTable({
        head: [['Produto', 'Quantidade', 'Preço por Unidade', 'Preço Final']],
        body: tableData,
        startY: 80,
        theme: 'grid',
        styles: { 
          fontSize: 10,
          cellPadding: 5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [26, 35, 126],
          fontSize: 12,
          halign: 'center',
          fontStyle: 'bold'
        },
        bodyStyles: {
          halign: 'center'
        }
      });

      // Add total
      const total = savedProducts.reduce((sum, product) => sum + parseFloat(product.finalPrice), 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: R$ ${total.toFixed(2)}`, pageWidth - 20, doc.lastAutoTable.finalY + 20, { align: 'right' });

      // Add footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('Vizualiza Comunicação Visual', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });
      doc.text('Contato: (41) 99551-8116 | Email: gregory@vizualiza.com', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

      doc.save('orcamento-vizualiza.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    }
  };

  const handleShareWhatsApp = () => {
    let message = 'Orçamento:\n\n'
    savedProducts.forEach(product => {
      message += `${product.name}\nQuantidade: ${product.quantity}\nValor Total: R$ ${product.finalPrice}\n\n`
    })
    
    const total = savedProducts.reduce((sum, product) => sum + parseFloat(product.finalPrice), 0)
    message += `Total: R$ ${total.toFixed(2)}`
    
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const handleInputChange = (e, setter) => {
    const value = e.target.value
    setter(value)
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? '🌞' : '🌙'}
      </button>
      <h1>Calculadora de Orçamento</h1>
      <div className="input-container">
        <label htmlFor="name">Nome do Produto:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => handleInputChange(e, setName)}
          placeholder="Digite o nome do produto"
        />
      </div>
      <div className="input-container">
        <label htmlFor="quantity">Quantidade:</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => handleInputChange(e, setQuantity)}
          placeholder="1"
          min="1"
          step="1"
        />
      </div>
      <div className="input-container">
        <label htmlFor="price">Preço (R$):</label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => handleInputChange(e, setPrice)}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>
      <div className="input-container">
        <label htmlFor="unit">Unidade:</label>
        <input
          type="number"
          id="unit"
          value={unit}
          onChange={(e) => handleInputChange(e, setUnit)}
          placeholder="1"
          min="1"
          step="1"
        />
      </div>
      <div className="button-container">
        <button onClick={handleCalculate} className="calculate-btn">Calcular</button>
        {calculatedPrice && <button onClick={handleSave} className="save-btn">Salvar</button>}
        {savedProducts.length > 0 && (
          <>
            <button onClick={handleExportPDF} className="export-btn">Baixar PDF</button>
            <button onClick={handleShareWhatsApp} className="share-btn">Enviar WhatsApp</button>
          </>
        )}
      </div>
      {calculatedPrice && (
        <div className="saved-products">
          <h2>Resumo do Orçamento</h2>
          <div className="products-list">
            <div className="saved-product-item">
              <div className="product-info">
                <p><strong>{name}</strong></p>
                <p>Quantidade: {quantity}</p>
                <p>Unidade: {unit}</p>
                <p>Preço: R$ {price}</p>
                <p>Preço por Unidade: R$ {pricePerUnit}</p>
                <p>Preço Final: R$ {calculatedPrice}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {savedProducts.length > 0 && (
        <div className="saved-products">
          <h2>Produtos Salvos</h2>
          <div className="products-list">
            {savedProducts.map(product => (
                <div key={product.id} className="saved-product-item">
                    <div className="product-info">
                        <p><strong>{product.name}</strong></p>
                        <p>Quantidade: {product.quantity}</p>
                        <p>Unidade: {product.unit}</p>
                        <p>Preço: R$ {product.basePrice}</p>
                        <p>Preço por Unidade: R$ {product.pricePerUnit}</p>
                        <p>Preço Final: R$ {product.finalPrice}</p>
                    </div>
                    <button 
                        onClick={() => handleDelete(product.id)} 
                        className="delete-btn"
                        aria-label="Deletar produto"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
