// Computes and reports a score from 3 packages and 13 custom tests, with discounts.
exports.scorer = acts => {
  // Initialize the score, including weights for the log statistics.
  let deficit = {
    total: 0,
    axe: null,
    ibm: null,
    wave: null,
    bulk: null,
    embAc: null,
    focInd: null,
    focOl: null,
    focOp: null,
    hover: null,
    labClash: null,
    linkUl: null,
    motion: null,
    radioSet: null,
    role: null,
    styleDiff: null,
    logCount: 1.5,
    logSize: 0.02
  };
  let facts;
  if (Array.isArray(acts)) {
    const tests = acts.filter(act => act.type === 'test');
    // Discounts from deficit scores based on multi-test reporting of the same faults.
    const ruleDiscounts = {
      axe: {
        'aria-allowed-role': 1,
        'aria-roles': 2,
        'color-contrast': 2,
        'image-redundant-alt': 1,
        'label': 3,
        'link-name': 2,
        'region': 1
      },
      ibm: {
        'aria_semantics_role': 2,
        'IBMA_Color_Contrast_WCAG2AA': 2,
        'Rpt_Aria_OrphanedContent_Native_Host_Sematics': 2,
        'Rpt_Aria_ValidIdRef': 2,
        'Rpt_Aria_ValidRole': 2,
        'WCAG20_A_HasText': 2,
        'WCAG20_Fieldset_HasLegend': 3,
        'WCAG20_Input_ExplicitLabel': 2,
        'WCAG20_Input_RadioChkInFieldSet': 3
      },
      wave4: {
        'alt_redundant': 1,
        'aria_reference_broken': 2,
        'contrast': 1,
        'fieldset_missing': 1,
        'label_orphaned': 1,
        'legend_missing': 1,
        'link_empty': 2,
        'select_missing_label': 1
      }
    };
    tests.forEach(test => {
      const {which} = test;
      if (which === 'axe') {
        facts = test.result && test.result.violations;
        if (facts) {
          const rules = test.result.items || [];
          let totalDiscount = 0;
          rules.forEach(rule => {
            const ruleDiscount = ruleDiscounts.axe[rule.rule];
            if (ruleDiscount) {
              totalDiscount += ruleDiscount * rule.elements.length;
            }
          });
          deficit.axe
            = 2 * facts.minor
            + 3 * facts.moderate
            + 4 * facts.serious
            + 5 * facts.critical
            - totalDiscount
            || 0;
          deficit.total += deficit.axe;
        }
      }
      else if (which === 'ibm') {
        facts = test.result && test.result.totals;
        if (facts) {
          const rules = test.result.items || [];
          let totalDiscount = 0;
          rules.forEach(rule => {
            const ruleDiscount = ruleDiscounts.ibm[rule.ruleId];
            if (ruleDiscount) {
              totalDiscount += ruleDiscount;
            }
          });
          deficit.ibm = 4 * facts.violation + 2 * facts.recommendation - totalDiscount || 0;
          deficit.total += deficit.ibm;
        }
      }
      else if (which === 'wave') {
        facts = test.result && test.result.categories;
        if (facts) {
          let totalDiscount = 0;
          ['error', 'contrast', 'alert'].forEach(level => {
            const items = facts[level].items;
            const rules = Object.keys(items);
            rules.forEach(rule => {
              const ruleDiscount = ruleDiscounts.wave4[rule] * items[rule].count;
              if (ruleDiscount) {
                totalDiscount += ruleDiscount;
              }
            });
          });
          deficit.wave
            = 2 * facts.alert.count
            + 3 * facts.contrast.count
            + 4 * facts.error.count
            - totalDiscount
            || 0;
          deficit.total += deficit.wave;
        }
      }
      else if (which === 'bulk') {
        facts = test.result;
        deficit.bulk = 100;
        if (facts && typeof facts.visibleElements === 'number') {
          // Deficit: square root of the excess of the element count over 150.
          deficit.bulk = Math.floor(Math.sqrt(Math.max(0, facts.visibleElements - 150)));
        }
        deficit.total += deficit.bulk;
      }
      else if (which === 'embAc') {
        facts = test.result && test.result.totals;
        deficit.embAc = 100;
        if (facts) {
          deficit.embAc = 4 * (facts.links + facts.buttons + facts.inputs + facts.selects);
        }
        deficit.total += deficit.embAc;
      }
      else if (which === 'focInd') {
        facts = test.result && test.result.totals;
        facts = facts ? facts.types : null;
        facts = facts ? facts.indicatorMissing : null;
        deficit.focInd = 150;
        if (facts) {
          deficit.focInd = 5 * facts.total;
        }
        deficit.total += deficit.focInd;
      }
      else if (which === 'focOl') {
        facts = test.result && test.result.totals;
        facts = facts ? facts.types : null;
        facts = facts ? facts.outlineMissing : null;
        deficit.focOl = 100;
        if (facts) {
          deficit.focOl = 3 * facts.total;
        }
        deficit.total += deficit.focOl;
      }
      else if (which === 'focOp') {
        facts = test.result && test.result.totals;
        deficit.focOp = 150;
        if (facts) {
          deficit.focOp
            = 4 * facts.operableNotFocusable.total + 1 * facts.focusableNotOperable.total;
        }
        deficit.total += deficit.focOp;
      }
      else if (which === 'hover') {
        facts = test.result && test.result.totals;
        deficit.hover = 150;
        if (facts) {
          deficit.hover = 4 * facts.triggers + 2 * facts.targets;
        }
        deficit.total += deficit.hover;
      }
      else if (which === 'labClash') {
        facts = test.result && test.result.totals;
        deficit.labClash = 100;
        if (facts) {
          // Unlabeled elements discounted.
          deficit.labClash = 2 * facts.mislabeled + 2 * facts.unlabeled;
        }
        deficit.total += deficit.labClash;
      }
      else if (which === 'linkUl') {
        facts = test.result && test.result.totals;
        facts = facts ? facts.inline : null;
        deficit.linkUl = 150;
        if (facts) {
          deficit.linkUl = 3 * (facts.total - facts.underlined);
        }
        deficit.total += deficit.linkUl;
      }
      else if (which === 'motion') {
        facts = test.result;
        deficit.motion = 150;
        if (facts && facts.bytes) {
          deficit.motion = Math.floor(
            15 * (facts.meanLocalRatio - 1)
            + 15 * (facts.maxLocalRatio - 1)
            + 15 * (facts.globalRatio - 1)
            + facts.meanPixelChange / 25000
            + facts.maxPixelChange / 25000
            + 10 * facts.changeFrequency
          );
        }
        deficit.total = deficit.motion;
      }
      else if (which === 'radioSet') {
        facts = test.result && test.result.totals;
        deficit.radioSet = 100;
        if (facts) {
          // Defects discounted.
          deficit.radioSet = 2 * (facts.total - facts.inSet);
        }
        deficit.total += deficit.radioSet;
      }
      else if (which === 'role') {
        facts = test.result;
        deficit.role = 100;
        if (facts && typeof facts === 'object') {
          // Defects discounted.
          deficit.role = 2 * facts.badRoleElements;
        }
        deficit.total += deficit.role;
      }
      else if (which === 'styleDiff') {
        facts = test.result && test.result.totals;
        deficit.styleDiff = 100;
        if (facts) {
          // Identify an array of objects having tag-name totals and style distributions as values.
          const tagNameCounts = Object.values(facts);
          // Identify an array of pairs of counts of excess styles and nonplurality elements.
          const deficits = tagNameCounts.map(
            item => {
              const subtotals = item.subtotals ? item.subtotals : [item.total];
              return [subtotals.length - 1, item.total - subtotals[0]];
            }
          );
          // Deficit: 2 per excess style + 0.2 per nonplurality element.
          deficit.styleDiff = Math.floor(deficits.reduce(
            (total, currentPair) => total + 2 * currentPair[0] + 0.2 * currentPair[1], 0
          )) || 100;
        }
        deficit.total += deficit.styleDiff;
      }
    });
    // If at least 1 test package but not all test packages failed, assign penalty deficits.
    const estimate = (tests, penalty) => {
      const packageScores = tests.map(test => deficit[test]).filter(score => score !== null);
      const scoreCount = packageScores.length;
      let meanScore;
      if (scoreCount) {
        meanScore = Math.floor(
          packageScores.reduce((sum, current) => sum + current) / packageScores.length
        );
      }
      else {
        meanScore = 100;
      }
      tests.forEach(test => {
        if (deficit[test] === null) {
          deficit[test] = meanScore + penalty;
          deficit.total += deficit[test];
        }
      });
    };
    estimate(['axe', 'ibm', 'wave'], 100);
    // If focOp failed, assign a penalty deficit.
    if (deficit.focOp === null) {
      deficit.focOp = 150;
      deficit.total += deficit.focOp;
    }
  }
  // Return the score, except for the log test.
  return deficit;
};
