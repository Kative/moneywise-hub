/**
 * MoneyWise Hub — Calculator Logic
 * Pure JavaScript, no dependencies
 */

(function() {
  'use strict';

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  function formatCurrency(amount) {
    return '$' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatCurrencyDecimal(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? parseFloat(el.value) || 0 : 0;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function addMonths(date, months) {
    var d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  function formatDate(date) {
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[date.getMonth()] + ' ' + date.getFullYear();
  }

  // ==========================================
  // 50/30/20 BUDGET CALCULATOR
  // ==========================================
  
  var calcBudgetBtn = document.getElementById('calculate-budget');
  if (calcBudgetBtn) {
    calcBudgetBtn.addEventListener('click', function() {
      var income = getVal('monthly-income');
      
      if (income <= 0) {
        alert('Please enter your monthly income.');
        return;
      }

      var needs = income * 0.5;
      var wants = income * 0.3;
      var savings = income * 0.2;

      setText('result-needs', formatCurrency(needs));
      setText('result-wants', formatCurrency(wants));
      setText('result-savings', formatCurrency(savings));
      setText('result-annual-savings', formatCurrency(savings * 12));

      // Animate results
      var resultsEl = document.getElementById('budget-results');
      if (resultsEl) {
        resultsEl.classList.add('visible');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Real-time calculation on input
    var incomeInput = document.getElementById('monthly-income');
    if (incomeInput) {
      incomeInput.addEventListener('input', function() {
        var income = parseFloat(this.value) || 0;
        if (income > 0) {
          setText('result-needs', formatCurrency(income * 0.5));
          setText('result-wants', formatCurrency(income * 0.3));
          setText('result-savings', formatCurrency(income * 0.2));
          setText('result-annual-savings', formatCurrency(income * 0.2 * 12));
        }
      });
    }
  }

  // ==========================================
  // EMERGENCY FUND / SAVINGS CALCULATOR
  // ==========================================
  
  var calcSavingsBtn = document.getElementById('calculate-savings');
  if (calcSavingsBtn) {
    calcSavingsBtn.addEventListener('click', function() {
      var expenses = getVal('monthly-expenses');
      var monthsCoverage = parseInt(document.getElementById('months-coverage').value) || 6;
      var currentSavings = getVal('current-savings');
      var contribution = getVal('monthly-contribution');

      if (expenses <= 0) {
        alert('Please enter your monthly expenses.');
        return;
      }
      if (contribution <= 0) {
        alert('Please enter how much you can save monthly.');
        return;
      }

      var target = expenses * monthsCoverage;
      var remaining = Math.max(0, target - currentSavings);
      var monthsToGoal = remaining > 0 ? Math.ceil(remaining / contribution) : 0;
      var percent = Math.min(100, Math.round((currentSavings / target) * 100));
      var goalDate = addMonths(new Date(), monthsToGoal);

      setText('result-target', formatCurrency(target));
      setText('result-remaining', formatCurrency(remaining));
      setText('result-months', monthsToGoal.toString());
      setText('result-percent', percent + '%');
      setText('result-date', remaining <= 0 ? '🎉 Already there!' : formatDate(goalDate));

      // Animate progress bar
      var progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = '0%';
        setTimeout(function() {
          progressBar.style.width = percent + '%';
        }, 100);
      }

      var resultsEl = document.getElementById('savings-results');
      if (resultsEl) {
        resultsEl.classList.add('visible');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ==========================================
  // DEBT PAYOFF CALCULATOR
  // ==========================================

  // Add debt entry
  var addDebtBtn = document.getElementById('add-debt');
  var debtIndex = 1;
  
  if (addDebtBtn) {
    addDebtBtn.addEventListener('click', function() {
      var container = document.getElementById('debts-container');
      if (!container) return;
      
      debtIndex++;
      var entry = document.createElement('div');
      entry.className = 'debt-entry';
      entry.setAttribute('data-index', debtIndex - 1);
      entry.style.cssText = 'background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-5); margin-bottom: var(--space-4); animation: fadeInUp 0.3s ease;';
      entry.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">' +
        '<strong style="font-size: var(--text-sm);">Debt #' + debtIndex + '</strong>' +
        '<button type="button" class="btn btn--ghost remove-debt" style="font-size: var(--text-sm); color: var(--color-danger); padding: 2px 8px;">✕ Remove</button>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
        '<div class="form-group"><label style="font-size: var(--text-xs);">Name</label><input type="text" class="form-input debt-name" placeholder="Debt name" style="font-size: var(--text-sm); padding: var(--space-2) var(--space-3);"></div>' +
        '<div class="form-group"><label style="font-size: var(--text-xs);">Balance</label><input type="number" class="form-input debt-balance" placeholder="0" min="0" style="font-size: var(--text-sm); padding: var(--space-2) var(--space-3);"></div>' +
        '<div class="form-group"><label style="font-size: var(--text-xs);">Interest Rate (%)</label><input type="number" class="form-input debt-rate" placeholder="0" min="0" max="100" step="0.1" style="font-size: var(--text-sm); padding: var(--space-2) var(--space-3);"></div>' +
        '<div class="form-group"><label style="font-size: var(--text-xs);">Min Payment</label><input type="number" class="form-input debt-min-payment" placeholder="0" min="0" style="font-size: var(--text-sm); padding: var(--space-2) var(--space-3);"></div>' +
        '</div>';
      
      container.appendChild(entry);
      
      // Remove handler
      entry.querySelector('.remove-debt').addEventListener('click', function() {
        entry.style.animation = 'fadeInUp 0.2s ease reverse';
        setTimeout(function() { entry.remove(); }, 200);
      });
    });
  }

  // Calculate debt payoff
  var calcDebtBtn = document.getElementById('calculate-debt');
  if (calcDebtBtn) {
    calcDebtBtn.addEventListener('click', function() {
      var entries = document.querySelectorAll('.debt-entry');
      var debts = [];
      
      entries.forEach(function(entry) {
        var name = entry.querySelector('.debt-name').value || 'Debt';
        var balance = parseFloat(entry.querySelector('.debt-balance').value) || 0;
        var rate = parseFloat(entry.querySelector('.debt-rate').value) || 0;
        var minPay = parseFloat(entry.querySelector('.debt-min-payment').value) || 0;
        
        if (balance > 0 && minPay > 0) {
          debts.push({ name: name, balance: balance, rate: rate, minPayment: minPay });
        }
      });

      if (debts.length === 0) {
        alert('Please add at least one debt with a balance and minimum payment.');
        return;
      }

      var extraPayment = getVal('extra-payment');

      // Calculate snowball (smallest balance first)
      var snowball = calculatePayoff(debts, extraPayment, 'snowball');
      
      // Calculate avalanche (highest rate first)
      var avalanche = calculatePayoff(debts, extraPayment, 'avalanche');

      setText('snowball-months', snowball.months + ' months');
      setText('snowball-interest', formatCurrency(snowball.totalInterest));
      setText('avalanche-months', avalanche.months + ' months');
      setText('avalanche-interest', formatCurrency(avalanche.totalInterest));

      var interestSaved = Math.abs(snowball.totalInterest - avalanche.totalInterest);
      setText('interest-saved', formatCurrency(interestSaved));

      // Highlight winner
      var snowballCard = document.getElementById('snowball-card');
      var avalancheCard = document.getElementById('avalanche-card');
      
      if (avalanche.totalInterest <= snowball.totalInterest) {
        avalancheCard.style.borderColor = 'var(--color-primary-light)';
        snowballCard.style.borderColor = 'transparent';
      } else {
        snowballCard.style.borderColor = 'var(--color-secondary-light)';
        avalancheCard.style.borderColor = 'transparent';
      }

      var resultsEl = document.getElementById('debt-results');
      if (resultsEl) {
        resultsEl.classList.add('visible');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function calculatePayoff(originalDebts, extraPayment, method) {
    // Deep copy debts
    var debts = originalDebts.map(function(d) {
      return { name: d.name, balance: d.balance, rate: d.rate, minPayment: d.minPayment };
    });

    var totalInterest = 0;
    var months = 0;
    var maxMonths = 600; // 50 year cap

    while (months < maxMonths) {
      // Check if all debts are paid off
      var allPaid = debts.every(function(d) { return d.balance <= 0; });
      if (allPaid) break;

      months++;
      var extraBudget = extraPayment;

      // Sort debts based on method
      var activeDebts = debts.filter(function(d) { return d.balance > 0; });
      
      if (method === 'snowball') {
        activeDebts.sort(function(a, b) { return a.balance - b.balance; });
      } else {
        activeDebts.sort(function(a, b) { return b.rate - a.rate; });
      }

      // Apply interest and minimum payments first
      debts.forEach(function(debt) {
        if (debt.balance <= 0) return;
        
        var monthlyInterest = debt.balance * (debt.rate / 100 / 12);
        totalInterest += monthlyInterest;
        debt.balance += monthlyInterest;

        var payment = Math.min(debt.minPayment, debt.balance);
        debt.balance -= payment;
        
        if (debt.balance < 0.01) debt.balance = 0;
      });

      // Apply extra payment to target debt
      if (activeDebts.length > 0 && extraBudget > 0) {
        // Find the target debt in the original array
        var targetName = activeDebts[0].name;
        for (var i = 0; i < debts.length; i++) {
          if (debts[i].name === targetName && debts[i].balance > 0) {
            var extraApplied = Math.min(extraBudget, debts[i].balance);
            debts[i].balance -= extraApplied;
            extraBudget -= extraApplied;
            if (debts[i].balance < 0.01) debts[i].balance = 0;
            break;
          }
        }

        // If extra budget remains, apply to next target
        if (extraBudget > 0.01) {
          for (var j = 1; j < activeDebts.length && extraBudget > 0.01; j++) {
            var nextTarget = activeDebts[j].name;
            for (var k = 0; k < debts.length; k++) {
              if (debts[k].name === nextTarget && debts[k].balance > 0) {
                var applied = Math.min(extraBudget, debts[k].balance);
                debts[k].balance -= applied;
                extraBudget -= applied;
                if (debts[k].balance < 0.01) debts[k].balance = 0;
                break;
              }
            }
          }
        }
      }
    }

    return { months: months, totalInterest: totalInterest };
  }

})();
