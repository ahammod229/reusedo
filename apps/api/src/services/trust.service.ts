import { TrustRepository, UserRepository, ExchangeRepository } from "@reusedo/database";
import type { 
  CreateReviewData, 
  CreateVerificationData, 
  CreateReportData, 
  CreateAppealData 
} from "@reusedo/validation";

export class TrustService {
  private trustRepo: typeof TrustRepository;
  private userRepo: typeof UserRepository;
  private exchangeRepo: typeof ExchangeRepository;

  constructor() {
    this.trustRepo = TrustRepository;
    this.userRepo = UserRepository;
    this.exchangeRepo = ExchangeRepository;
  }

  // --- Reviews ---
  async submitReview(reviewerId: string, revieweeId: string, data: CreateReviewData) {
    // 1. Validate exchange exists and is completed
    const exchange = await this.exchangeRepo.getExchangeById(data.exchangeId, reviewerId);
    if (!exchange) {
      throw new Error("Exchange not found.");
    }
    if (exchange.status !== "completed") {
      throw new Error("Can only review completed exchanges.");
    }

    // 2. Validate reviewer is part of the exchange
    if (exchange.requester_id !== reviewerId && exchange.recipient_id !== reviewerId) {
      throw new Error("You are not part of this exchange.");
    }

    // 3. Create the review
    const review = await this.trustRepo.createReview(reviewerId, revieweeId, data);

    // 4. Recalculate Trust Score & Average Rating
    await this.recalculateTrustScore(revieweeId);

    return review;
  }

  async getReviewsForUser(userId: string) {
    return this.trustRepo.getReviewsForUser(userId);
  }

  // --- Trust Score Calculation ---
  private async recalculateTrustScore(userId: string) {
    const reviews = await this.trustRepo.getReviewsForUser(userId);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      await this.trustRepo.updateProfileTrustScore(userId, 0, 0, 0);
      return;
    }

    // 1. Calculate Average Rating
    const sumRatings = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sumRatings / totalReviews;

    // 2. Base Trust Score (1-100) based on Average Rating (1-5)
    // Rating 1 = 20, 2 = 40, 3 = 60, 4 = 80, 5 = 100
    let trustScore = (averageRating / 5) * 100;

    // 3. Add points for verification
    const verification = await this.trustRepo.getVerification(userId);
    if (verification?.status === "approved") {
      trustScore += 10;
    }

    // 4. Add points for total completed exchanges (approximated here by total reviews received for now, or could query exchanges)
    // For simplicity, add 1 point per review up to 10 points
    trustScore += Math.min(totalReviews, 10);

    // 5. Cap at 100
    trustScore = Math.min(Math.round(trustScore), 100);

    await this.trustRepo.updateProfileTrustScore(userId, Number(averageRating.toFixed(2)), totalReviews, trustScore);
  }

  // --- Verifications ---
  async submitVerification(userId: string, data: CreateVerificationData) {
    return this.trustRepo.createVerification(userId, data);
  }

  async getVerificationStatus(userId: string) {
    return this.trustRepo.getVerification(userId);
  }

  async updateVerificationStatus(verificationId: string, status: "approved" | "rejected", adminNotes?: string) {
    const updated = await this.trustRepo.updateVerificationStatus(verificationId, status, adminNotes);
    
    if (status === "approved") {
      await this.trustRepo.setProfileVerified(updated.user_id, true);
      await this.recalculateTrustScore(updated.user_id);
    } else if (status === "rejected") {
      await this.trustRepo.setProfileVerified(updated.user_id, false);
      await this.recalculateTrustScore(updated.user_id);
    }

    return updated;
  }

  // --- Reports ---
  async submitReport(reporterId: string, data: CreateReportData) {
    return this.trustRepo.createReport(reporterId, data);
  }

  async getReports() {
    return this.trustRepo.getReports();
  }

  // --- Appeals ---
  async submitAppeal(userId: string, data: CreateAppealData) {
    return this.trustRepo.createAppeal(userId, data);
  }
}

export const trustService = new TrustService();
