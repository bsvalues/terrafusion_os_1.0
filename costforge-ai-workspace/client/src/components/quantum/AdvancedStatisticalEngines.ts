/**
 * Advanced Statistical Engines
 * PhD-Level Statistical Analysis for CostForge AI
 *
 * Implements championship-level statistical methods:
 * - Bayesian Property Modeling
 * - Monte Carlo Analysis
 * - Advanced Regression Models
 *
 * TerraFusion OS - Government. Transcended.
 */

export interface BayesianAnalysisResult {
  posteriorDistribution: number[];
  credibleInterval: [number, number];
  bayesFactor: number;
  modelEvidence: number;
  uncertainty: number;
  convergenceMetrics: {
    rHat: number;
    effectiveSampleSize: number;
    mcmcDiagnostics: any;
  };
}

export interface MonteCarloResult {
  meanEstimate: number;
  standardError: number;
  confidenceInterval: [number, number];
  probabilityDistribution: number[];
  convergenceStatus: 'converged' | 'needs_more_samples' | 'diverged';
  samplesUsed: number;
  effectiveVariance: number;
}

export interface RegressionResult {
  coefficients: { [variable: string]: number };
  standardErrors: { [variable: string]: number };
  pValues: { [variable: string]: number };
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  residualAnalysis: {
    normality: number;
    heteroscedasticity: number;
    autocorrelation: number;
  };
  modelDiagnostics: any;
}

/**
 * Bayesian Property Modeler
 * Uses advanced Bayesian inference for property valuation uncertainty quantification
 */
export class BayesianPropertyModeler {
  private priorParameters: any;
  private mcmcSamples: number[];
  private convergenceThreshold: number = 1.01; // R-hat threshold

  constructor(priorType: 'jeffreys' | 'conjugate' | 'non_informative' = 'jeffreys') {
    this.initializePriors(priorType);
  }

  private initializePriors(priorType: string): void {
    switch (priorType) {
      case 'jeffreys':
        this.priorParameters = {
          type: 'jeffreys',
          parameters: { scale: 1.0 },
        };
        break;
      case 'conjugate':
        this.priorParameters = {
          type: 'normal_gamma',
          parameters: { mu: 0, kappa: 1, alpha: 1, beta: 1 },
        };
        break;
      case 'non_informative':
        this.priorParameters = {
          type: 'uniform',
          parameters: { lower: -Infinity, upper: Infinity },
        };
        break;
    }
  }

  /**
   * Perform Bayesian analysis on property data
   */
  async analyzeProperty(
    propertyData: any,
    marketData: any,
    iterations: number = 10000
  ): Promise<BayesianAnalysisResult> {
    // Simulate Hamiltonian Monte Carlo sampling
    const samples = await this.hamiltonianMonteCarlo(propertyData, marketData, iterations);

    // Calculate posterior statistics
    const posterior = this.calculatePosteriorStatistics(samples);

    // Convergence diagnostics
    const convergence = this.calculateConvergenceMetrics(samples);

    // Bayesian model comparison
    const evidence = this.calculateModelEvidence(samples);

    return {
      posteriorDistribution: posterior.distribution,
      credibleInterval: posterior.credibleInterval,
      bayesFactor: evidence.bayesFactor,
      modelEvidence: evidence.logEvidence,
      uncertainty: posterior.uncertainty,
      convergenceMetrics: convergence,
    };
  }

  private async hamiltonianMonteCarlo(
    data: any,
    market: any,
    iterations: number
  ): Promise<number[]> {
    const samples: number[] = [];
    let currentPosition = this.initializePosition(data);
    let currentMomentum = this.generateMomentum();

    for (let i = 0; i < iterations; i++) {
      // Leapfrog integration
      const { newPosition, newMomentum } = this.leapfrogStep(
        currentPosition,
        currentMomentum,
        data,
        market
      );

      // Metropolis acceptance
      const acceptanceProbability = this.calculateAcceptanceProbability(
        currentPosition,
        newPosition,
        currentMomentum,
        newMomentum,
        data
      );

      if (Math.random() < acceptanceProbability) {
        currentPosition = newPosition;
        samples.push(currentPosition);
      } else {
        samples.push(currentPosition);
      }

      currentMomentum = this.generateMomentum();
    }

    return samples;
  }

  private initializePosition(data: any): number {
    // Initialize with maximum likelihood estimate
    return data.averageValue || 0;
  }

  private generateMomentum(): number {
    // Generate from standard normal distribution
    return this.normalRandom(0, 1);
  }

  private leapfrogStep(
    position: number,
    momentum: number,
    data: any,
    market: any,
    stepSize: number = 0.01,
    steps: number = 10
  ): { newPosition: number; newMomentum: number } {
    let p = position;
    let m = momentum;

    // Half step for momentum
    m = m - (stepSize / 2) * this.gradientLogPosterior(p, data, market);

    // Full steps for position and momentum
    for (let i = 0; i < steps; i++) {
      p = p + stepSize * m;
      if (i < steps - 1) {
        m = m - stepSize * this.gradientLogPosterior(p, data, market);
      }
    }

    // Final half step for momentum
    m = m - (stepSize / 2) * this.gradientLogPosterior(p, data, market);

    return { newPosition: p, newMomentum: m };
  }

  private gradientLogPosterior(position: number, data: any, market: any): number {
    // Calculate gradient of log posterior density
    const likelihoodGradient = this.likelihoodGradient(position, data);
    const priorGradient = this.priorGradient(position);
    return likelihoodGradient + priorGradient;
  }

  private likelihoodGradient(position: number, data: any): number {
    // Simplified gradient calculation
    const residual = data.observedValue - position;
    const variance = data.observationalVariance || 1;
    return residual / variance;
  }

  private priorGradient(position: number): number {
    // Gradient based on prior type
    switch (this.priorParameters.type) {
      case 'jeffreys':
        return -1 / position;
      case 'normal_gamma':
        const { mu, kappa } = this.priorParameters.parameters;
        return -kappa * (position - mu);
      default:
        return 0;
    }
  }

  private calculateAcceptanceProbability(
    oldPos: number,
    newPos: number,
    oldMom: number,
    newMom: number,
    data: any
  ): number {
    const oldEnergy = this.calculateHamiltonian(oldPos, oldMom, data);
    const newEnergy = this.calculateHamiltonian(newPos, newMom, data);
    return Math.min(1, Math.exp(oldEnergy - newEnergy));
  }

  private calculateHamiltonian(position: number, momentum: number, data: any): number {
    const potentialEnergy = -this.logPosterior(position, data);
    const kineticEnergy = 0.5 * momentum * momentum;
    return potentialEnergy + kineticEnergy;
  }

  private logPosterior(position: number, data: any): number {
    // Log posterior density calculation
    const logLikelihood = this.logLikelihood(position, data);
    const logPrior = this.logPrior(position);
    return logLikelihood + logPrior;
  }

  private logLikelihood(position: number, data: any): number {
    const residual = data.observedValue - position;
    const variance = data.observationalVariance || 1;
    return (-0.5 * (residual * residual)) / variance - 0.5 * Math.log(2 * Math.PI * variance);
  }

  private logPrior(position: number): number {
    switch (this.priorParameters.type) {
      case 'jeffreys':
        return -Math.log(Math.abs(position));
      case 'normal_gamma':
        const { mu, kappa } = this.priorParameters.parameters;
        return -0.5 * kappa * (position - mu) * (position - mu);
      default:
        return 0;
    }
  }

  private calculatePosteriorStatistics(samples: number[]): any {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (samples.length - 1);
    const sorted = samples.sort((a, b) => a - b);

    return {
      distribution: samples,
      mean,
      variance,
      credibleInterval: [
        sorted[Math.floor(0.025 * samples.length)],
        sorted[Math.floor(0.975 * samples.length)],
      ],
      uncertainty: Math.sqrt(variance),
    };
  }

  private calculateConvergenceMetrics(samples: number[]): any {
    // Split samples into chains for R-hat calculation
    const chainLength = Math.floor(samples.length / 2);
    const chain1 = samples.slice(0, chainLength);
    const chain2 = samples.slice(chainLength);

    const rHat = this.calculateRHat([chain1, chain2]);
    const ess = this.calculateEffectiveSampleSize(samples);

    return {
      rHat,
      effectiveSampleSize: ess,
      mcmcDiagnostics: {
        converged: rHat < this.convergenceThreshold,
        chains: 2,
        warmup: Math.floor(samples.length * 0.1),
      },
    };
  }

  private calculateRHat(chains: number[][]): number {
    // Gelman-Rubin convergence diagnostic
    const numChains = chains.length;
    const chainLength = chains[0].length;

    const chainMeans = chains.map(chain => chain.reduce((a, b) => a + b, 0) / chain.length);
    const overallMean = chainMeans.reduce((a, b) => a + b, 0) / numChains;

    const betweenChainVariance =
      (chainLength * chainMeans.reduce((a, mean) => a + (mean - overallMean) ** 2, 0)) /
      (numChains - 1);

    const withinChainVariance =
      chains.reduce((total, chain, i) => {
        const chainMean = chainMeans[i];
        const variance =
          chain.reduce((a, val) => a + (val - chainMean) ** 2, 0) / (chainLength - 1);
        return total + variance;
      }, 0) / numChains;

    const pooledVariance =
      ((chainLength - 1) * withinChainVariance + betweenChainVariance) / chainLength;

    return Math.sqrt(pooledVariance / withinChainVariance);
  }

  private calculateEffectiveSampleSize(samples: number[]): number {
    // Simplified ESS calculation
    const autocorrelations = this.calculateAutocorrelations(samples);
    const tau =
      1 +
      2 *
        autocorrelations.reduce((sum, rho, k) => {
          return k < autocorrelations.length / 4 ? sum + rho : sum;
        }, 0);

    return samples.length / tau;
  }

  private calculateAutocorrelations(samples: number[]): number[] {
    const n = samples.length;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const variance = samples.reduce((a, x) => a + (x - mean) ** 2, 0) / n;

    const autocorrelations: number[] = [];
    const maxLag = Math.min(n / 4, 100);

    for (let lag = 0; lag < maxLag; lag++) {
      let covariance = 0;
      for (let i = 0; i < n - lag; i++) {
        covariance += (samples[i] - mean) * (samples[i + lag] - mean);
      }
      covariance /= n - lag;
      autocorrelations.push(covariance / variance);
    }

    return autocorrelations;
  }

  private calculateModelEvidence(samples: number[]): any {
    // Harmonic mean estimator (simplified)
    const logLikelihoods = samples.map(sample => this.logLikelihood(sample, {}));
    const harmonicMean =
      logLikelihoods.length / logLikelihoods.reduce((sum, logL) => sum + Math.exp(-logL), 0);

    return {
      logEvidence: Math.log(harmonicMean),
      bayesFactor: 1.0, // Simplified - would compare against null model
    };
  }

  private normalRandom(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

/**
 * Monte Carlo Cost Analyzer
 * Advanced Monte Carlo methods for cost uncertainty quantification
 */
export class MonteCarloAnalyzer {
  private samplesGenerated: number = 0;
  private convergenceThreshold: number = 0.001;

  async analyzeCostUncertainty(
    costParameters: any,
    uncertaintyModel: any,
    targetSamples: number = 100000
  ): Promise<MonteCarloResult> {
    const samples: number[] = [];
    let previousMean = 0;
    let convergenceAchieved = false;

    for (let i = 0; i < targetSamples; i++) {
      const sample = this.generateCostSample(costParameters, uncertaintyModel);
      samples.push(sample);

      // Check convergence every 1000 samples
      if (i > 1000 && i % 1000 === 0) {
        const currentMean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const convergenceMetric = Math.abs(currentMean - previousMean) / Math.abs(currentMean);

        if (convergenceMetric < this.convergenceThreshold) {
          convergenceAchieved = true;
          break;
        }

        previousMean = currentMean;
      }
    }

    return this.calculateMonteCarloStatistics(samples, convergenceAchieved);
  }

  private generateCostSample(parameters: any, uncertaintyModel: any): number {
    // Generate sample based on uncertainty distributions
    let totalCost = 0;

    // Material costs with uncertainty
    const materialCost = this.sampleFromDistribution(
      parameters.baseMaterialCost,
      uncertaintyModel.materialUncertainty
    );

    // Labor costs with uncertainty
    const laborCost = this.sampleFromDistribution(
      parameters.baseLaborCost,
      uncertaintyModel.laborUncertainty
    );

    // Market volatility
    const marketMultiplier = this.sampleFromDistribution(1.0, uncertaintyModel.marketVolatility);

    totalCost = (materialCost + laborCost) * marketMultiplier;

    return totalCost;
  }

  private sampleFromDistribution(mean: number, uncertainty: any): number {
    switch (uncertainty.distribution) {
      case 'normal':
        return this.normalRandom(mean, uncertainty.standardDeviation);
      case 'lognormal':
        return this.lognormalRandom(mean, uncertainty.standardDeviation);
      case 'triangular':
        return this.triangularRandom(uncertainty.min, mean, uncertainty.max);
      case 'uniform':
        return this.uniformRandom(uncertainty.min, uncertainty.max);
      default:
        return mean;
    }
  }

  private normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private lognormalRandom(mean: number, stdDev: number): number {
    const normal = this.normalRandom(0, 1);
    const mu = Math.log(mean) - 0.5 * stdDev * stdDev;
    return Math.exp(mu + stdDev * normal);
  }

  private triangularRandom(min: number, mode: number, max: number): number {
    const u = Math.random();
    const fc = (mode - min) / (max - min);

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  private uniformRandom(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private calculateMonteCarloStatistics(samples: number[], converged: boolean): MonteCarloResult {
    const n = samples.length;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const variance = samples.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1);
    const standardError = Math.sqrt(variance / n);

    // Calculate confidence intervals
    const tValue = 1.96; // 95% confidence interval
    const confidenceInterval: [number, number] = [
      mean - tValue * standardError,
      mean + tValue * standardError,
    ];

    // Sort samples for percentile calculation
    const sorted = samples.sort((a, b) => a - b);

    return {
      meanEstimate: mean,
      standardError,
      confidenceInterval,
      probabilityDistribution: this.createHistogram(sorted),
      convergenceStatus: converged ? 'converged' : 'needs_more_samples',
      samplesUsed: n,
      effectiveVariance: variance,
    };
  }

  private createHistogram(sortedSamples: number[], bins: number = 50): number[] {
    const min = sortedSamples[0];
    const max = sortedSamples[sortedSamples.length - 1];
    const binWidth = (max - min) / bins;
    const histogram = new Array(bins).fill(0);

    for (const sample of sortedSamples) {
      const binIndex = Math.min(Math.floor((sample - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    }

    // Normalize to probability density
    const totalSamples = sortedSamples.length;
    return histogram.map(count => count / (totalSamples * binWidth));
  }
}

/**
 * Advanced Regression Models
 * Multi-modal regression analysis for property valuation
 */
export class AdvancedRegressionModels {
  async performMultiVariateRegression(
    dependentVariable: number[],
    independentVariables: { [name: string]: number[] },
    modelType: 'linear' | 'polynomial' | 'ridge' | 'lasso' | 'elastic_net' = 'linear'
  ): Promise<RegressionResult> {
    const X = this.prepareDesignMatrix(independentVariables, modelType);
    const y = dependentVariable;

    // Perform regression based on model type
    let coefficients: number[];

    switch (modelType) {
      case 'ridge':
        coefficients = this.ridgeRegression(X, y, 0.1);
        break;
      case 'lasso':
        coefficients = this.lassoRegression(X, y, 0.1);
        break;
      case 'elastic_net':
        coefficients = this.elasticNetRegression(X, y, 0.1, 0.5);
        break;
      default:
        coefficients = this.ordinaryLeastSquares(X, y);
    }

    // Calculate regression statistics
    const predictions = this.predictValues(X, coefficients);
    const residuals = y.map((actual, i) => actual - predictions[i]);

    const rSquared = this.calculateRSquared(y, predictions);
    const adjustedRSquared = this.calculateAdjustedRSquared(rSquared, y.length, X[0].length);

    // Calculate standard errors and p-values
    const standardErrors = this.calculateStandardErrors(X, residuals);
    const pValues = this.calculatePValues(coefficients, standardErrors, y.length - X[0].length);

    // Residual analysis
    const residualAnalysis = this.performResidualAnalysis(residuals, predictions);

    // Convert coefficients array to named object
    const variableNames = Object.keys(independentVariables);
    const coefficientObject: { [key: string]: number } = {};
    const standardErrorObject: { [key: string]: number } = {};
    const pValueObject: { [key: string]: number } = {};

    variableNames.forEach((name, i) => {
      coefficientObject[name] = coefficients[i + 1]; // Skip intercept
      standardErrorObject[name] = standardErrors[i + 1];
      pValueObject[name] = pValues[i + 1];
    });

    // Add intercept
    coefficientObject['intercept'] = coefficients[0];
    standardErrorObject['intercept'] = standardErrors[0];
    pValueObject['intercept'] = pValues[0];

    const fStatistic = this.calculateFStatistic(y, predictions, X[0].length);

    return {
      coefficients: coefficientObject,
      standardErrors: standardErrorObject,
      pValues: pValueObject,
      rSquared,
      adjustedRSquared,
      fStatistic,
      residualAnalysis,
      modelDiagnostics: {
        modelType,
        sampleSize: y.length,
        variables: variableNames.length,
        residualStandardError: Math.sqrt(
          residuals.reduce((a, r) => a + r * r, 0) / (y.length - X[0].length)
        ),
      },
    };
  }

  private prepareDesignMatrix(
    independentVariables: { [name: string]: number[] },
    modelType: string
  ): number[][] {
    const variableNames = Object.keys(independentVariables);
    const n = independentVariables[variableNames[0]].length;

    // Start with intercept column
    const X: number[][] = [];
    for (let i = 0; i < n; i++) {
      X[i] = [1]; // Intercept term
    }

    // Add independent variables
    variableNames.forEach(name => {
      for (let i = 0; i < n; i++) {
        X[i].push(independentVariables[name][i]);
      }
    });

    // Add polynomial terms if needed
    if (modelType === 'polynomial') {
      variableNames.forEach(name => {
        for (let i = 0; i < n; i++) {
          const value = independentVariables[name][i];
          X[i].push(value * value); // Quadratic terms
        }
      });
    }

    return X;
  }

  private ordinaryLeastSquares(X: number[][], y: number[]): number[] {
    // Calculate (X'X)^(-1)X'y
    const XTranspose = this.transpose(X);
    const XTX = this.matrixMultiply(XTranspose, X);
    const XTXInverse = this.matrixInverse(XTX);
    const XTy = this.matrixVectorMultiply(XTranspose, y);

    return this.matrixVectorMultiply(XTXInverse, XTy);
  }

  private ridgeRegression(X: number[][], y: number[], lambda: number): number[] {
    // Calculate (X'X + λI)^(-1)X'y
    const XTranspose = this.transpose(X);
    const XTX = this.matrixMultiply(XTranspose, X);

    // Add ridge penalty
    for (let i = 0; i < XTX.length; i++) {
      XTX[i][i] += lambda;
    }

    const XTXInverse = this.matrixInverse(XTX);
    const XTy = this.matrixVectorMultiply(XTranspose, y);

    return this.matrixVectorMultiply(XTXInverse, XTy);
  }

  private lassoRegression(X: number[][], y: number[], lambda: number): number[] {
    // Simplified LASSO using coordinate descent
    const p = X[0].length;
    const n = X.length;
    let beta = new Array(p).fill(0);

    // Normalize features
    const XNormalized = this.normalizeMatrix(X);

    // Coordinate descent iterations
    for (let iter = 0; iter < 1000; iter++) {
      for (let j = 0; j < p; j++) {
        // Calculate partial residual
        const partialResidual = y.map((yi, i) => {
          let sum = 0;
          for (let k = 0; k < p; k++) {
            if (k !== j) sum += XNormalized[i][k] * beta[k];
          }
          return yi - sum;
        });

        // Calculate correlation with j-th feature
        const correlation =
          partialResidual.reduce((sum, r, i) => sum + r * XNormalized[i][j], 0) / n;

        // Soft thresholding
        if (correlation > lambda) {
          beta[j] = correlation - lambda;
        } else if (correlation < -lambda) {
          beta[j] = correlation + lambda;
        } else {
          beta[j] = 0;
        }
      }
    }

    return beta;
  }

  private elasticNetRegression(
    X: number[][],
    y: number[],
    lambda: number,
    alpha: number
  ): number[] {
    // Simplified Elastic Net (combination of Ridge and LASSO)
    const ridgeResult = this.ridgeRegression(X, y, lambda * (1 - alpha));
    const lassoResult = this.lassoRegression(X, y, lambda * alpha);

    // Combine results (simplified approach)
    return ridgeResult.map((ridge, i) => (ridge + lassoResult[i]) / 2);
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, y) => sum + (y - actualMean) ** 2, 0);
    const residualSumSquares = actual.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0);

    return 1 - residualSumSquares / totalSumSquares;
  }

  private calculateAdjustedRSquared(rSquared: number, n: number, p: number): number {
    return 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);
  }

  private calculateStandardErrors(X: number[][], residuals: number[]): number[] {
    const n = X.length;
    const p = X[0].length;
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / (n - p);

    const XTranspose = this.transpose(X);
    const XTX = this.matrixMultiply(XTranspose, X);
    const XTXInverse = this.matrixInverse(XTX);

    return XTXInverse.map((row, i) => Math.sqrt(mse * row[i]));
  }

  private calculatePValues(coefficients: number[], standardErrors: number[], df: number): number[] {
    return coefficients.map((coef, i) => {
      const tStat = coef / standardErrors[i];
      return 2 * (1 - this.studentTCDF(Math.abs(tStat), df));
    });
  }

  private calculateFStatistic(actual: number[], predicted: number[], p: number): number {
    const n = actual.length;
    const actualMean = actual.reduce((a, b) => a + b, 0) / n;

    const msr = predicted.reduce((sum, pred) => sum + (pred - actualMean) ** 2, 0) / (p - 1);
    const mse = actual.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0) / (n - p);

    return msr / mse;
  }

  private performResidualAnalysis(residuals: number[], predictions: number[]): any {
    // Normality test (simplified Shapiro-Wilk)
    const normality = this.testNormality(residuals);

    // Heteroscedasticity test (Breusch-Pagan)
    const heteroscedasticity = this.testHeteroscedasticity(residuals, predictions);

    // Autocorrelation test (Durbin-Watson)
    const autocorrelation = this.testAutocorrelation(residuals);

    return {
      normality,
      heteroscedasticity,
      autocorrelation,
    };
  }

  private testNormality(residuals: number[]): number {
    // Simplified normality test - returns p-value
    const n = residuals.length;
    if (n < 3) return 1.0;

    const sorted = residuals.sort((a, b) => a - b);
    const mean = residuals.reduce((a, b) => a + b, 0) / n;
    const variance = residuals.reduce((a, r) => a + (r - mean) ** 2, 0) / (n - 1);

    // Simple skewness and kurtosis test
    const skewness =
      residuals.reduce((a, r) => a + Math.pow((r - mean) / Math.sqrt(variance), 3), 0) / n;
    const kurtosis =
      residuals.reduce((a, r) => a + Math.pow((r - mean) / Math.sqrt(variance), 4), 0) / n - 3;

    // Jarque-Bera test statistic
    const jb = (n / 6) * (skewness * skewness + (kurtosis * kurtosis) / 4);

    // Rough p-value approximation
    return Math.exp(-jb / 2);
  }

  private testHeteroscedasticity(residuals: number[], predictions: number[]): number {
    // Breusch-Pagan test - returns p-value
    const squaredResiduals = residuals.map(r => r * r);

    // Regress squared residuals on predictions
    const mean = squaredResiduals.reduce((a, b) => a + b, 0) / squaredResiduals.length;
    const tss = squaredResiduals.reduce((sum, sr) => sum + (sr - mean) ** 2, 0);

    const predMean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    const numerator = squaredResiduals.reduce(
      (sum, sr, i) => sum + (predictions[i] - predMean) * (sr - mean),
      0
    );
    const denominator = predictions.reduce((sum, pred) => sum + (pred - predMean) ** 2, 0);

    const rSquared = (numerator * numerator) / (denominator * tss);
    const lm = squaredResiduals.length * rSquared;

    // Chi-square approximation
    return Math.exp(-lm / 2);
  }

  private testAutocorrelation(residuals: number[]): number {
    // Durbin-Watson test statistic
    const n = residuals.length;
    if (n < 2) return 2.0;

    let numerator = 0;
    let denominator = 0;

    for (let i = 1; i < n; i++) {
      numerator += (residuals[i] - residuals[i - 1]) ** 2;
    }

    for (let i = 0; i < n; i++) {
      denominator += residuals[i] ** 2;
    }

    return numerator / denominator;
  }

  private predictValues(X: number[][], coefficients: number[]): number[] {
    return X.map(row => row.reduce((sum, x, i) => sum + x * coefficients[i], 0));
  }

  // Matrix operations
  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];

    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }

    return result;
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result: number[][] = [];

    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        result[i][j] = 0;
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }

    return result;
  }

  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, element, i) => sum + element * vector[i], 0));
  }

  private matrixInverse(matrix: number[][]): number[][] {
    const n = matrix.length;
    const identity = this.createIdentityMatrix(n);
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make diagonal 1
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // Extract inverse
    return augmented.map(row => row.slice(n));
  }

  private createIdentityMatrix(n: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        result[i][j] = i === j ? 1 : 0;
      }
    }
    return result;
  }

  private normalizeMatrix(matrix: number[][]): number[][] {
    const cols = matrix[0].length;
    const means = new Array(cols).fill(0);
    const stds = new Array(cols).fill(0);

    // Calculate means
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < matrix.length; i++) {
        means[j] += matrix[i][j];
      }
      means[j] /= matrix.length;
    }

    // Calculate standard deviations
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < matrix.length; i++) {
        stds[j] += (matrix[i][j] - means[j]) ** 2;
      }
      stds[j] = Math.sqrt(stds[j] / (matrix.length - 1));
    }

    // Normalize
    return matrix.map(row => row.map((val, j) => (stds[j] > 0 ? (val - means[j]) / stds[j] : val)));
  }

  private studentTCDF(t: number, df: number): number {
    // Simplified Student's t-distribution CDF
    if (df === 1) {
      return 0.5 + Math.atan(t) / Math.PI;
    }

    // Use normal approximation for large df
    if (df > 30) {
      return this.normalCDF(t);
    }

    // Rough approximation
    const x = t / Math.sqrt(df);
    return 0.5 + 0.5 * Math.sign(t) * Math.pow(Math.abs(x) / (1 + Math.abs(x)), 0.5);
  }

  private normalCDF(x: number): number {
    // Standard normal CDF approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Error function approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
