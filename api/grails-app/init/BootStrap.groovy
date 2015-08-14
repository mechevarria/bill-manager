import api.Defaults
import api.Owner
import api.Bill
import api.Expense
import api.Detail

class BootStrap {

    def init = { servletContext ->
        if(Defaults.list().size() < 1) {
            def newDefaults = new Defaults()
                .addToOwners(new Owner([name: 'owner1', label: 'owner1', color: 'info']))
                .addToOwners(new Owner([name: 'owner2', label: 'owner2', color: 'danger']))

            newDefaults.save()
        }
    }
    def destroy = {
    }
}
