class CreateItems < ActiveRecord::Migration[7.1]
  def change
    create_table :items do |t|
      t.string :name
      t.boolean :purchased, null: false, default: false
      t.text :notes

      t.timestamps
    end
  end
end
