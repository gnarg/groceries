ActsAsTaggableOn.default_parser = TagParser

class Item < ApplicationRecord
  acts_as_taggable_on :tags
end
