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
function calculateBonusByProfit(profit, index, total) {
  // @TODO: Расчет бонуса от позиции в рейтинге

  let bonusPercent = 0;

  if (index === 0) {
    // Первое место - максимальный бонус
    bonusPercent = 15;
  } else if (index <= 2) {
    // Второе и третье место
    bonusPercent = 10;
  } else if (index < total - 1) {
    // Все остальные, кроме последнего
    bonusPercent = 5;
  } else {
    // Последнее место
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

  if (!data || !data.purchase_records || !data.products) {
    throw new Error("Неверные входные данные");
  }

  // @TODO: Проверка наличия опций

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

    // Подсчет статистики по товарам
    receipt.items.forEach((item) => {
      const product = productsMap[item.sku];

      if (!product) return;

      // Расчет прибыли и выручки
      const profit = calculateSimpleRevenue(item, product);
      const revenue = (item.sale_price - (item.discount / 100) * item.sale_price) * item.quantity;

      // Обновление статистики продавца
      salesStats[sellerId].revenue += revenue;
      salesStats[sellerId].profit += profit;
      salesStats[sellerId].sales_count++;

      // Подсчет популярных товаров
      if (!salesStats[sellerId].top_products[item.sku]) {
        salesStats[sellerId].top_products[item.sku] = 0;
      }
      salesStats[sellerId].top_products[item.sku] += item.quantity;
    });
  });

  // Преобразование статистики в массив
  const result = Object.values(salesStats);

  // @TODO: Сортировка продавцов по прибыли

  // Сортировка по прибыли (от большего к меньшему)
  result.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  // Формирование топ-10 товаров и расчет бонусов

  return result.map((stat, index) => {
    // Форматируем топ-10 товаров

    const topProductsArray = Object.entries(stat.top_products)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Рассчитываем бонус

    const bonus = calculateBonusByProfit(index, result.length);

    return {
      seller_id: stat.seller_id,
      name: stat.name,
      revenue: parseFloat(stat.revenue.toFixed(2)),
      profit: parseFloat(stat.profit.toFixed(2)),
      sales_count: stat.sales_count,
      top_products: topProductsArray,
      bonus: parseFloat(
        calculateBonusByProfit(stat.profit, index, result.length).toFixed(2)
      ),
    };
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
}
