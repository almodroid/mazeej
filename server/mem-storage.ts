class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private userId: number = 1;
  
  private categories: Map<number, Category> = new Map();
  private categoryId: number = 1;
  
  private projects: Map<number, Project> = new Map();
  private projectId: number = 1;
  
  private proposals: Map<number, Proposal> = new Map();
  private proposalId: number = 1;
  
  private reviews: Map<number, Review> = new Map();
  private reviewId: number = 1;
  
  private userSkills: Map<number, UserSkill> = new Map();
  private userSkillId: number = 1;
  
  private skills: Map<number, Skill> = new Map();
  private skillId: number = 1;
  
  private verificationRequests: Map<number, VerificationRequest> = new Map();
  private verificationRequestId: number = 1;
  
  private payments: Map<number, Payment> = new Map();
  private paymentId: number = 1;
  
  private transactions: Map<number, Transaction> = new Map();
  private transactionId: number = 1;
  
  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(payment: CreatePaymentParams): Promise<Payment> {
    const id = this.paymentId++;
    const now = new Date();
    const { userId, amount, status, type, projectId, description } = payment;
    
    const newPayment: Payment = {
      id,
      userId,
      amount,
      status,
      type,
      projectId,
      description,
      createdAt: now,
    };
    
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
  }

  async deletePayment(id: number): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Transaction operations
  async createTransaction(transaction: CreateTransactionParams): Promise<Transaction> {
    const id = this.transactionId++;
    const now = new Date();
    const { paymentId, userId, amount, type, status, description } = transaction;
    
    const newTransaction: Transaction = {
      id,
      paymentId,
      userId,
      amount,
      type,
      status,
      description,
      createdAt: now,
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt.getTime();
        const timeB = b.createdAt.getTime();
        return timeB - timeA;
      });
  }

  async deleteTransactionsByPaymentId(paymentId: number): Promise<boolean> {
    const transactions = Array.from(this.transactions.entries())
      .filter(([_, transaction]) => transaction.paymentId === paymentId);
    
    let success = true;
    for (const [id] of transactions) {
      const result = this.transactions.delete(id);
      if (!result) success = false;
    }
    
    return success;
  }
} 