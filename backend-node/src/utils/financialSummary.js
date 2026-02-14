export const buildFinancialSummary = (transactions) => {
  let totalCredit = 0;
  let totalDebit = 0;
  let categoryMap = {};
  let suspiciousCount = 0;

  transactions.forEach(tx => {
    if (tx.type === "credit") totalCredit += tx.amount;
    else totalDebit += tx.amount;

    if (tx.type === "debit") {
      categoryMap[tx.category] =
        (categoryMap[tx.category] || 0) + tx.amount;
    }

    if (tx.isSuspicious) suspiciousCount++;
  });

  const balance = totalCredit - totalDebit;

  return {
    totalCredit,
    totalDebit,
    balance,
    categoryMap,
    suspiciousCount
  };
};
