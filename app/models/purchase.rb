class Purchase < ActiveRecord::Base
  belongs_to :item
  scope :recent, -> { where('created_at > ?', 1.month.ago) }
end
