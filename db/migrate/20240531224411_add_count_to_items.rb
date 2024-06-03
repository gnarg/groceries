class AddCountToItems < ActiveRecord::Migration[7.1]
  def change
    add_column :items, :count, :integer, null: false, default: 0
  end
end
