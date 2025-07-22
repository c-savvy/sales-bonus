/**
 * Функция для расчета прибыли
 * @param {object} purchase запись о покупке
 * @param {object} _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет прибыли от операции

  // Проверка обязательных полей
  if (!purchase || !_product) {
    throw new Error("Неверные входные данные");
  }

  // Проверка числовых значений
  const isNumeric = (value) => typeof value === "number" && !isNaN(value);

  if (
    !isNumeric(purchase.sale_price) ||
    !isNumeric(purchase.discount) ||
    !isNumeric(purchase.quantity) ||
    !isNumeric(_product.purchase_price)
  ) {
    throw new Error("Нечисловые значения в данных");
  }

  // Расчет скидки в рублях
  const discountAmount = (purchase.discount / 100) * purchase.sale_price;

  // Расчет выручки с учетом скидки
  const revenue = (purchase.sale_price - discountAmount) * purchase.quantity;

  // Расчет прибыли (выручка минус закупочная цена)
  const profit = revenue - _product.purchase_price * purchase.quantity;

  // return { revenue, profit };
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param {number} index порядковый номер в отсортированном массиве
 * @param {number} total общее число продавцов
 * @param {object} seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // Получаем прибыль из объекта продавца
  const profit = seller.profit || seller.stats?.profit || 0;

  let bonusPercent = 0;

  if (index === 0) {
    bonusPercent = 15;
  } else if (index <= 2) {
    bonusPercent = 10;
  } else if (index < total - 1) {
    bonusPercent = 5;
  } else {
    bonusPercent = 0;
  }

  return (profit * bonusPercent) / 100;
}

/**
 * Функция для анализа данных продаж
 * @param {object} data
 * @param {object} options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options = {}) {
  // @TODO: Проверка входных данных

  if (!data) {
    throw new Error("Данные не переданы");
  }

  // Проверка корректности переданных функций в опциях
  if (
    options.calculateRevenue &&
    typeof options.calculateRevenue !== "function"
  ) {
    throw new Error("calculateRevenue должна быть функцией");
  }

  if (options.calculateBonus && typeof options.calculateBonus !== "function") {
    throw new Error("calculateBonus должна быть функцией");
  }
  // Проверка наличия обязательных массивов
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Массив продавцов пуст или не является массивом");
  }

  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("Массив товаров пуст или не является массивом");
  }

  if (
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Массив чеков пуст или не является массивом");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  // Индексация товаров
  const productsMap = data.products.reduce((map, product) => {
    map[product.sku] = product;
    return map;
  }, {});

  // Индексация продавцов
  const sellersMap = data.sellers.reduce((map, seller) => {
    map[seller.id] = seller;
    return map;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца

  // Сбор статистики по продавцам

  const salesStats = {};

  // Проход по всем чекам

  data.purchase_records.forEach((receipt) => {
    const sellerId = receipt.seller_id;

    // Проверка существования продавца
    if (!sellersMap[sellerId]) return;

    // Создание записи для продавца, если её нет
    if (!salesStats[sellerId]) {
      salesStats[sellerId] = {
        seller_id: sellerId,
        name:
          sellersMap[sellerId].first_name +
          " " +
          sellersMap[sellerId].last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        top_products: {},
      };
    }
    salesStats[sellerId].sales_count++;

    // Подсчет статистики по товарам

    receipt.items.forEach((item) => {
      const product = productsMap[item.sku];

      if (!product) return;

      // Расчет прибыли и выручки
      const revenue = calculateSimpleRevenue(item, product);
      const profit = revenue - product.purchase_price * item.quantity;

      // Обновление статистики продавца
      salesStats[sellerId].revenue += revenue;
      salesStats[sellerId].profit += profit;

      // Подсчет популярных товаров
      if (!salesStats[sellerId].top_products[item.sku]) {
        salesStats[sellerId].top_products[item.sku] = 0;
      }
      salesStats[sellerId].top_products[item.sku] += item.quantity;
    });
  });

  // Преобразование статистики в массив
  const result = Object.values(salesStats);

  // Сортировка по прибыли (от большего к меньшему)
  result.sort((a, b) => b.profit - a.profit);

  // Формирование топ-10 товаров и расчет бонусов
  return result.map((stat, index) => {
    // Проверка существования stat перед работой с ним
    if (!stat) {
      throw new Error("Неверный объект статистики продавца");
    }

    // Форматируем топ-10 товаров
    const topProductsArray = Object.entries(stat.top_products)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Рассчитываем бонус
    const bonus = calculateBonusByProfit(index, result.length, stat);

    return {
      seller_id: stat.seller_id,
      name: stat.name,
      revenue: parseFloat(stat.revenue.toFixed(2)),
      profit: parseFloat(stat.profit.toFixed(2)),
      sales_count: stat.sales_count,
      top_products: topProductsArray,
      bonus: parseFloat(bonus.toFixed(2)), // Используем уже рассчитанный бонус
    };
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
}
