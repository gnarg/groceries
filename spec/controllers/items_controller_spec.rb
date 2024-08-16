require 'rails_helper'

RSpec.describe ItemsController, type: :controller do
  let(:valid_attributes) { { name: 'Test Item', tag_list: 'test-tag' } }
  let(:invalid_attributes) { { name: '' } }
  let(:item) { Item.create!(valid_attributes) }

  describe "GET #index" do
    context "when session[:purchased] is set" do
      # it "limits items to 20" do
      #   session[:purchased] = true
      #   get :index
      #   expect(assigns(:items).count).to be <= 20
      # end
      it 'lists only purchased items' do
        item.update!(purchased: true)
        session[:purchased] = true
        get :index
        expect(assigns(:items)).to eq([item])
      end
    end

    context "when session[:purchased] is not set" do
      it 'lists only unpurchased items' do
        item.update!(purchased: false)
        get :index
        expect(assigns(:items)).to eq([item])
      end
    end

    it 'sorts items by the number of purchases' do
      item.purchases.create!
      get :index
      expect(assigns(:items)).to eq([item])
    end

    context "when params[:search] is provided" do
      it "filters item name by search term" do
        get :index, params: { search: 'test' }
        expect(assigns(:items)).to include(item)
      end

      it "filters item tag by search term" do
        get :index, params: { search: 'tag' }
        expect(assigns(:items)).to include(item)
      end
    end

    context "when params[:tag] is provided" do
      it "filters items by tag" do
        get :index, params: { tag: 'test-tag' }
        expect(assigns(:items)).to include(item)
      end
    end
  end

  # describe "GET #new" do
  #   it "assigns a new item as @item" do
  #     get :new
  #     expect(assigns(:item)).to be_a_new(Item)
  #   end
  # end

  describe "POST #create" do
    context "with valid params" do
      it "creates a new Item" do
        expect {
          post :create, params: { item: valid_attributes }
        }.to change(Item, :count).by(1)
      end

      it "redirects to the created item" do
        post :create, params: { item: valid_attributes }
        expect(response).to redirect_to(Item.last)
      end
    end

    # context "with invalid params" do
    #   it "renders the new template" do
    #     post :create, params: { item: invalid_attributes }
    #     expect(response).to render_template("new")
    #   end
    # end
  end

  describe "GET #edit" do
    it "assigns the requested item as @item" do
      get :edit, params: { id: item.to_param }
      expect(assigns(:item)).to eq(item)
    end
  end

  describe "PUT #update" do
    context "with valid params" do
      let(:new_attributes) { { name: 'Updated Item' } }

      it "updates the requested item" do
        put :update, params: { id: item.to_param, item: new_attributes }
        item.reload
        expect(item.name).to eq('Updated Item')
      end

      it "redirects to the item" do
        put :update, params: { id: item.to_param, item: new_attributes }
        expect(response).to redirect_to(item)
      end
    end

    context "with invalid params" do
      it "renders the edit template" do
        put :update, params: { id: item.to_param, item: invalid_attributes }
        expect(response).to render_template("edit")
      end
    end

    context "when item is purchased" do
      it "creates a new Purchase" do
        expect {
          put :update, params: { id: item.to_param, item: { purchased: true } }
        }.to change(Purchase, :count).by(1)
      end
    end
  end
end
