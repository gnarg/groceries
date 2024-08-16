class Purchase < ActiveRecord::Base
  belongs_to :item
  scope :recent, -> { where('purchases.created_at > ?', 1.month.ago).or(where('purchases.created_at IS NULL')) }
end
