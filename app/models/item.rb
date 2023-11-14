ActsAsTaggableOn.default_parser = TagParser

class Item < ApplicationRecord
  acts_as_taggable_on :tags
  validates_presence_of :name
end
