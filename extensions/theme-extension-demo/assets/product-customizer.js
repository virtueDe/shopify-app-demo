/**
 * @typedef {Object} CustomizerSettings
 * @property {string} default_text - 默认显示的文本。
 * @property {string} text_color - 文本的十六进制颜色代码。
 * @property {number} font_size - 文本的字体大小（单位：px）。
 * @property {string} font_family - 文本的字体族。
 * @property {number} text_pos_x_percent - 文本中心点在图片宽度上的百分比位置 (0-100)。
 * @property {number} text_pos_y_percent - 文本基线在图片高度上的百分比位置 (0-100)。
 * @property {number} image_max_width - 图片预览的最大宽度。
 */

/**
 * @typedef {Object} CustomizerInstanceConfig
 * @property {CustomizerSettings} settings - 从 Liquid schema 获取的配置。
 * @property {string} imageUrl - 商品图片的 URL。
 * @property {string} productId - Shopify 商品 ID。
 */

/**
 * 初始化并管理单个商品文本定制器实例。
 * @param {string} blockId - 当前 Shopify block 的唯一 ID。
 * @param {CustomizerInstanceConfig} config - 该实例的配置。
 */
function initializeProductCustomizer(blockId, config) {
  const canvas = document.getElementById(`customizer-canvas-${blockId}`);
  const textInput = document.getElementById(`customizer-text-input-${blockId}`);

  if (!canvas || !textInput) {
    console.error(`[Customizer ${blockId}]：Canvas 或输入框未在 DOM 中找到。`);
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error(`[Customizer ${blockId}]：无法获取 Canvas 2D 上下文。`);
    return;
  }

  const { settings, imageUrl } = config;
  let currentText = textInput.value || settings.default_text;
  const baseImage = new Image();
  baseImage.crossOrigin = "anonymous"; // 允许跨域图片在 canvas 中使用

  /**
   * 根据图片实际加载后的尺寸调整 canvas 尺寸并进行首次绘制。
   */
  baseImage.onload = () => {
    // 根据图片原始宽高比和 canvas 的数据属性或 schema 设置来调整 canvas 尺寸
    const imageAspectRatio = baseImage.naturalHeight / baseImage.naturalWidth;
    let canvasWidth = canvas.width; // 从 Liquid 中获取的 width 属性 (基于 image_max_width)

    // 如果 canvas 初始宽度大于图片自然宽度（且 image_max_width 允许），则使用自然宽度
    if (settings.image_max_width === 0 || canvasWidth > baseImage.naturalWidth) {
        canvasWidth = baseImage.naturalWidth;
    }
    canvas.width = canvasWidth; // 确保 canvas 的绘图表面宽度正确
    canvas.height = canvasWidth * imageAspectRatio;

    // 更新输入框的初始值 (如果它是空的并且有默认值)
    if (textInput.value === '' && settings.default_text) {
        textInput.value = settings.default_text;
        currentText = settings.default_text;
    } else {
        currentText = textInput.value; // 确保 currentText 与输入框同步
    }
    redrawCanvas();
  };

  /**
   * 图片加载错误处理。
   */
  baseImage.onerror = () => {
    console.error(`[Customizer ${blockId}]：无法加载图片: ${imageUrl}`);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('图片加载失败', canvas.width / 2, canvas.height / 2);
  };

  // 设置图片源开始加载
  if (imageUrl) {
    baseImage.src = imageUrl;
  } else {
    console.error(`[Customizer ${blockId}]：图片 URL (imageUrl) 未提供。`);
    // 可以在 canvas 上绘制错误提示
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('未找到图片URL', canvas.width / 2, canvas.height / 2);
    return; // 没有图片 URL，无法继续
  }


  /**
   * 重新绘制 Canvas 内容（背景图和文本）。
   */
  function redrawCanvas() {
    if (!baseImage.complete || baseImage.naturalWidth === 0) {
      // 图片尚未加载完成，或加载失败，则不执行绘制
      return;
    }
    // 1. 清除 canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 绘制背景图片
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // 3. 绘制文本
    ctx.fillStyle = settings.text_color || '#000000';
    ctx.font = `${settings.font_size || 30}px ${settings.font_family || 'Arial'}`;
    ctx.textAlign = 'center'; // 水平居中对齐
    ctx.textBaseline = 'middle'; // 垂直居中对齐文本基线（更准确的垂直居中）

    // 计算文本位置
    // settings.text_pos_x_percent 和 settings.text_pos_y_percent 是 0-100 的值
    const textX = (canvas.width * (settings.text_pos_x_percent || 50)) / 100;
    const textY = (canvas.height * (settings.text_pos_y_percent || 50)) / 100;

    ctx.fillText(currentText, textX, textY);
  }

  /**
   * 处理输入框的输入事件。
   * @param {Event} event - 输入事件对象。
   */
  function handleTextInput(event) {
    currentText = event.target.value;
    redrawCanvas();
  }

  // 添加事件监听器
  textInput.addEventListener('input', handleTextInput);

  // 如果图片已经加载完成（例如从缓存加载），手动调用一次 onload 的逻辑部分
  // 这确保了即使图片加载非常快，canvas 尺寸和初次绘制也能正确执行
  if (baseImage.complete && baseImage.naturalWidth > 0) {
     // 手动触发类似 onload 的逻辑来设置 canvas 尺寸和绘制
    const imageAspectRatio = baseImage.naturalHeight / baseImage.naturalWidth;
    let canvasWidth = parseFloat(canvas.getAttribute('width')); // 从 canvas 属性获取初始宽度
    if (settings.image_max_width === 0 || canvasWidth > baseImage.naturalWidth) {
        canvasWidth = baseImage.naturalWidth;
    }
    canvas.width = canvasWidth;
    canvas.height = canvasWidth * imageAspectRatio;

    if (textInput.value === '' && settings.default_text) {
        textInput.value = settings.default_text;
        currentText = settings.default_text;
    } else {
        currentText = textInput.value;
    }
    redrawCanvas();
  }
}

// 当 DOM 加载完成后，初始化所有找到的定制器实例
document.addEventListener('DOMContentLoaded', () => {
  if (window.productCustomizers) {
    for (const blockId in window.productCustomizers) {
      if (Object.prototype.hasOwnProperty.call(window.productCustomizers, blockId)) {
        console.log(`[Customizer] 初始化 Block ID: ${blockId}`);
        initializeProductCustomizer(blockId, window.productCustomizers[blockId]);
      }
    }
  }
});